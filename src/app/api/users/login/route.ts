import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema } from "@/schema/authSchemas";

connect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(reqBody);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: errors 
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if password is correct
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create token data
    const tokenData = {
      id: user._id,
      email: user.email,
    };

    // Create token with expiration
    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
      expiresIn: "1d",
    });

    // Set secure cookie
    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}