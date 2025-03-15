
"use client";
import { Img, Text, Button, Heading, CheckBox, Input } from "../components";
import Link from "next/link";
import React from "react";
export default function LoginPage() {
  return (
    <div className="flex w-full items-start bg-white-a700 md:flex-col">
      <div className="mt-[82px] flex w-[40%] flex-col items-center gap-10 px-14 md:w-full md:px-5">
        <div className="ml-2.5 flex flex-col items-center gap-8 self-stretch md:ml-0">
          <div className="flex flex-col gap-5 self-stretch">
            <div className="flex flex-col items-start justify-center gap-1">
              <Text size="texts" as="p" className="text-[12.8px] font-normal">
                Welcome back!
              </Text>
              <Heading size="text3xl" as="h1" className="text-[25px] font-medium md:text-[23px] sm:text-[21px]">
                Log In to MentorUp
              </Heading>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col items-start">
                    <Text size="textlg" as="p" className="text-[16px] font-normal">
                      User name/Email
                    </Text>
                    <Input
                      shape="round"
                      name="inputcopy_one"
                      placeholder={`Input your user account`}
                      className="self-stretch rounded-lg !border-[0.5px] px-4"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <Text size="textlg" as="p" className="text-[16px] font-normal">
                      Password
                    </Text>
                    <Input
                      shape="round"
                      type="password"
                      name="password"
                      placeholder={`Input your password`}
                      suffix={
                        <Img
                          src="img_invisible_1.svg"
                          width={16}
                          height={16}
                          alt="Invisible 1"
                          className="my-0.5 h-[16px] w-[16px] object-contain"
                        />
                      }
                      className="gap-4 self-stretch rounded-lg !border-[0.5px] px-4"
                    />
                    <Text size="texts" as="p" className="mb-1 text-[12px] font-normal !text-red-500">
                      Incorrect user name or Password
                    </Text>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5">
                  <CheckBox
                    size="sm"
                    name="rememberme"
                    label="Remember me"
                    id="rememberme"
                    className="gap-3 text-[12px] text-black-900"
                  />
                  <Link href="#">
                    <Text size="texts" as="p" className="text-[12px] font-medium !text-gray-800_01 underline">
                      Forgot Password?
                    </Text>
                  </Link>
                </div>
              </div>
              <Button color="gray_900_01" shape="round" className="self-stretch rounded-lg px-[34px] font-bold sm:px-5">
                Login
              </Button>
            </div>
          </div>
          <Heading
            size="headingxs"
            as="h2"
            className="flex items-center justify-center bg-white-a700 px-4 !font-zenkakugothicantique text-[12.8px] font-bold !text-gray-900_01"
          >
            Or
          </Heading>
        </div>
        <Button
          shape="round"
          leftIcon={
            <Img
              src="img_google.svg"
              width={28}
              height={28}
              alt="Google"
              className="h-[28px] w-[28px] object-contain"
            />
          }
          className="ml-2.5 gap-3.5 self-stretch rounded-lg px-[34px] md:ml-0 sm:px-5"
        >
          Sign in with Google
        </Button>
        <Text size="texts" as="p" className="flex !font-poppins text-[12.8px] font-normal !text-gray-900_01">
          <span className="text-gray-900_01">New User? &nbsp;</span>
          <span className="font-bold text-gray-900_01">&nbsp;</span>
          <a href="#" className="inline font-bold text-black-900 underline">
            SIGN UP HERE
          </a>
        </Text>
      </div>
      <Img
        src="defaultNoData.png"
        width={760}
        height={832}
        alt="Image"
        className="h-[832px] flex-1 self-center object-cover md:w-full md:self-stretch"
      />
    </div>
  );
}