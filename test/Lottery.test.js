const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const { interface, bytecode } = require("../compile");

const web3 = new Web3(ganache.provider());

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: (1e6).toString() });
});

describe("Lottery Contract", () => {
  it("should deploy the contract", () => {
    assert.ok(lottery.options.address);
  });

  it("should allow an account to enter the lottery", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(players[0], accounts[0]);
    assert.equal(players.length, 1);
  });

  it("should allow multiple accounts to enter the lottery", async () => {
    const accountsSample = accounts.slice(0, 3);

    for (const account of accountsSample) {
      await lottery.methods.enter().send({
        from: account,
        value: web3.utils.toWei("0.02", "ether"),
      });
    }

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.deepEqual(players, accountsSample);

    assert.equal(players.length, accountsSample.length);
  });

  it("should require a minimum amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 0,
      });

      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("should ensure only manager can call pickWinner", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });

      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("should send money to the winner and reset players array", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei("2", "ether"),
      });

      assert(false);
    } catch (error) {
      assert(error);
    }

    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const finalBalance = await web3.eth.getBalance(accounts[0]);

    const difference = finalBalance - initialBalance;

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    const contractBalance = await web3.eth.getBalance(lottery.options.address);

    assert(difference > web3.utils.toWei("1.8", "ether"));

    assert(players.length === 0);

    assert.equal(contractBalance, 0);
  });
});
