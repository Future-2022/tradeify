export const importImage = (symbol) => {
  let value = '';
  if(symbol == 'ETH') {
    value = '../../img/png/eth-bg.png';
  } else if (symbol == 'BTC') {
    value = '../../img/svg/BTC.svg';
  } else if (symbol == 'TRY') {
    value = '../../img/logo3.png'
  } else {
    value = '../../img/png/SUI.png';
  }
  return value;
}