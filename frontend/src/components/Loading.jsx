import React, { useState } from "react";
import { STATUS_COMING, STATUS_RUNNING } from "../utils/constants";


const Loading = ({className}) => {
  return (
    <div className={className}>
      <div
        class="inline-block h-full w-full animate-spin rounded-full border-2 border-solid border-current border-r-transparent text-white motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status">
        <span
          class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
          >Loading...</span
        >
      </div>
    </div>
  );
};
export default Loading;
