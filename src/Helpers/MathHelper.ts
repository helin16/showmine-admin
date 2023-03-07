// import { mathExact } from 'math-exact';
import Big from 'big.js';

// const getTheBase = (arg1: number, arg2: number) => {
//   const [, decimalsArg1] = `${arg1}`.split('.');
//   const [, decimalsArg2] = `${arg2}`.split('.');
//   const decimalsArg1Length = `${decimalsArg1 || ''}`.length;
//   const decimalsArg2Length = `${decimalsArg2 || ''}`.length;
//   if (decimalsArg1Length === 0 && decimalsArg2Length === 0) {
//     return 1;
//   }
//   const noOfZeros = decimalsArg1Length > decimalsArg2Length ? decimalsArg1Length : decimalsArg2Length;
//   return Number(`1${'0'.repeat(noOfZeros)}`);
// };
//
// const convertArgs = (arg1: number, arg2: number) => {
//   const base = getTheBase(arg1, arg2);
//   // const arg1Converted = arg1 * base;
//   // const arg2Converted = mathExact('Multiply', arg2, base);
//   const [integerArg1, decimalsArg1] = `${arg1}`.split('.');
//   const [integerArg2, decimalsArg2] = `${arg2}`.split('.');
//
//   const decimalLength = `${base}`.length - 1;
//   const arg1Converted = Number(`${integerArg1}${(decimalsArg1 || '').padEnd(decimalLength, '0')}`);
//   const arg2Converted = Number(`${integerArg2}${(decimalsArg2 || '').padEnd(decimalLength, '0')}`);
//   return [arg1Converted, arg2Converted, base];
// };
//
// const add = (arg1: number, arg2: number) => {
//   const [arg1Converted, arg2Converted, base] = convertArgs(arg1, arg2);
//   return (arg1Converted + arg2Converted) / base;
//   // return mathExact('Add', arg1, arg2);
// };
//
// const sub = (arg1: number, arg2: number) => {
//   const [arg1Converted, arg2Converted, base] = convertArgs(arg1, arg2);
//   return (arg1Converted - arg2Converted) / base;
//   // return mathExact('Subtract', arg1, arg2);
// };
//
// const mul = (arg1: number, arg2: number) => {
//   const [arg1Converted, arg2Converted, base] = convertArgs(arg1, arg2);
//   return (arg1Converted * arg2Converted) / (base * base);
//   // return mathExact('Multiply', arg1, arg2);
// };
//
// const div = (arg1: number, arg2: number) => {
//   const [arg1Converted, arg2Converted] = convertArgs(arg1, arg2);
//   return arg1Converted / arg2Converted;
//   // return mathExact('Divide', arg1, arg2);
// };

const add = (arg1: number, arg2: number) => {
  const x = new Big(arg1);
  return x.add(arg2).toNumber();
};

const sub = (arg1: number, arg2: number) => {
  const x = new Big(arg1);
  return x.sub(arg2).toNumber();
};

const mul = (arg1: number, arg2: number) => {
  const x = new Big(arg1);
  return x.mul(arg2).toNumber();
};

const div = (arg1: number, arg2: number) => {
  const x = new Big(arg1);
  return x.div(arg2).toNumber();
};

const MathHelper = {
  add,
  sub,
  mul,
  div,
};
export default MathHelper;
