require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    coverage: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      network_id: '3'
    }
  }
};
