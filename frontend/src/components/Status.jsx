import React, { useState } from "react";
import { STATUS_COMING, STATUS_RUNNING } from "../utils/constants";


const Status = ({status}) => {
  
  return status === STATUS_COMING ? (
    <span className=" text-[10px] font-black text-white bg-red-500 p-1 rounded-full h-[20px] leading-[12px]">Coming</span>
  ) : (
    status === STATUS_RUNNING ? (
      <span className=" text-[10px] font-black text-white bg-blue-500 p-1 rounded-full h-[20px] leading-[12px]">Running</span>
    ) : (
      <span className=" text-[10px] font-black text-white bg-gray-800 p-1 rounded-full h-[20px] leading-[12px]">Over</span>
    )
  );
};

export default Status;
