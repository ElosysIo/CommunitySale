import React, { useState } from "react";

const PrimaryButton = ({ label, className, onClick}) => {
  
  return (
    <button
      className={`${className} text-white bg-green-400 hover:bg-green-500 disabled:bg-green-200 border-0 
          ${!className || className.indexOf('py') === -1 ? "py-2" : ""} px-4 rounded-lg  ${!className || ( className.indexOf('text') === -1) ? "text-base" : ""}
          flex items-center justify-center`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default PrimaryButton;
