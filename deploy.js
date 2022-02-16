require("dotenv").config();

const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile");

const provider = new HDWalletProvider(
  process.env.ACCOUNT_MNEMONIC,
  process.env.NETWORK_DEPLOY_ADDRESS
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  const mainAccount = accounts[0];

  console.log("Attempting to deploy from account", mainAccount);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ gas: (1e6).toString(), from: mainAccount });

  console.log(interface);
  console.log("Contract deployed to", result.options.address);

  provider.engine.stop();
};
deploy();
