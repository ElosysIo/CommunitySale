import { formatGwei } from "viem";

export const numberWithCommas = (x, digits = 3) => {
  return parseFloat(x).toLocaleString(undefined, { maximumFractionDigits: digits });
};

// Send data between components
export const EventBus = {
  on(event, callback) {
    document.addEventListener(event, (e) => callback(e.detail));
  },
  dispatch(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  remove(event, callback) {
    document.removeEventListener(event, callback);
  },
};

export const minAddress = (strAddress) => {
  return strAddress?.toString()?.substring(0, 6) + "..." + strAddress?.toString()?.substring(38, 42);
}

export const formatNumber = (number) => {
  let suffix = '';
  let formattedNumber = number;

  if (number >= 1e6) {
    suffix = 'M';
    formattedNumber = number / 1e6;
  } else if (number >= 1e3) {
    suffix = 'k';
    formattedNumber = number / 1e3;
  }
  return (formattedNumber && formattedNumber > 0) ? `${parseFloat(formattedNumber)?.toFixed(1)}${suffix}` : 0;
}

