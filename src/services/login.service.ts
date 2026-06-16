import bcrypt from "bcrypt";
import { getUserByEmail } from "../repositories/login.repository.js";
import { generateJWTToken } from "../utility/generateJWTToken.js";

interface LoginInput {
  email: string;
  password: string;
}

export const loginService = async ({
  email,
  password,
}: LoginInput) => {
  const user = await getUserByEmail(email);
  console.log({ user });
  if (!user) {
    throw new Error("Invalid Email or Password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );
  console.log({ isPasswordValid });

  if (!isPasswordValid) {
    throw new Error("Invalid Email or Password");
  }

  const token = generateJWTToken({
    user_id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullname: user.full_name,
    },
  };
};