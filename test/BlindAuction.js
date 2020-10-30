const { assert } = require('chai')

const { soliditySha3, toWei, fromAscii } = require("web3-utils");

const BigNumber = require('bignumber.js');

const Dns = artifacts.require("Dns");

const BlindAuction = artifacts.require('./mocks/MockBlindAuction.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()



// accounts are test accounts on local network
contract('BlindAuction', ([deployer, bidder1, bidder2, bidder3]) => {
  let blindAuction
  let dns
  let deployURL
  before(async () => {
    dns = await Dns.deployed(); // get the deployed Dns contract
    deployURL = "dns.ntu"
    const deployBlindAuction = await dns.startAuction(deployURL)
    const deployEvent = deployBlindAuction.logs[0].args
    auctionAddress = deployEvent._auction_addr
    // TODO: START TEST WITH ADDRESSS FROM CREATED IN DNS CONTRACT
    blindAuction = await BlindAuction.new(10, 10, deployURL, dns.address, deployer)
  })
  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await blindAuction.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has bidding time', async () => {
      const biddingEnd = BigNumber(await blindAuction.biddingEnd())
      const endTime = biddingEnd.c[0]
      // check that bidding end is below current time + 10s
      assert.isAtMost(endTime, Math.floor(Date.now() / 1000)+10)
    })

    it('has reveal time', async () => {
      const revealEnd = BigNumber(await blindAuction.revealEnd())
      const endTime = revealEnd.c[0]
      // check that reveal time is below current time + 20s
      assert.isAtMost(endTime, Math.floor(Date.now() / 1000)+20)
    })

    it('has url', async () => {
      const url = await blindAuction.url()
      assert.equal(url, deployURL)
    })

    it('has beneficiary', async() => {
      const beneficiary = await blindAuction.beneficiary()
      assert.equal(dns.address, beneficiary)
    })

    // it('has default winner', async() => {
    //   const highestBidder = await blindAuction.highestBidder()
    //   assert.equal(deployer, highestBidder, "Default Highest bidder should be auction starter")
    // })

    // it('has default highest bid', async() => {
    //   const highestBid = await blindAuction.highestBid()
    //   assert.equal(0, highestBid, "Default Highest bid should be 0")
    // })

  })

  describe('2 Bidders Success Case', async () => {
    let hashBid1
    let hashBid2
    let hashBid3
    
    let bid1
    let bid2
    let bid3

    let revealBidder1
    let revealBidder2 

    let auctionEnd

    let bidder1Withdraw
    let bidder2Withdraw
    
    before(async () => {
      // use URL below for keccak256 hash in JS
      // https://blog.8bitzen.com/posts/18-03-2019-keccak-abi-encodepacked-with-javascript/
      // remember change secret to bytes
      // pad secret to be 32bytes cause the solidity contract will convert it to bytes32 to hash
      // hash would be different if dont pad
      hashBid1 = soliditySha3(
        toWei("0.1"), // hash need to change to wei
        true,
        fromAscii("secret").padEnd(66, 0) 
      );
      hashBid2 = soliditySha3(
        toWei("0.2"), // hash need to change to Wei
        true,
        fromAscii("secret").padEnd(66, 0) // pad with 66 '0s' so that fit byte32 to match sol func
      );
      hashBid3 = soliditySha3(
        toWei("0.05"), // hash need to change to Wei
        false,
        fromAscii("secret").padEnd(66, 0) // pad with 66 '0s' so that fit byte32 to match sol func
      );
      // Sequential order of contract function calls as function can only be called after each other
      // therefore all to be called in sequence first to ensure they are executed in order
      // if not JS Async may cause some to execute out of order causing error
      // Create 3 bids
      bid1 = await blindAuction.bid(hashBid1, { from: bidder1, value: toWei("0.1") })
      bid2 = await blindAuction.bid(hashBid2, { from: bidder2, value: toWei("0.2") })
      bid3 = await blindAuction.bid(hashBid3, { from: bidder2, value: toWei("0.05") })
      // move time ahead by 10s so that can test onlyAfter & onlyBefore
      // for reveal bid to ensure it is after bidding time end and before reveal time end
      await blindAuction.moveAheadBiddingTime(11) // mock moving ahead by 11s (10s is time to bidding end)
      // NOTE: all ether values to be converted to Wei 
      // reveal for both users with their respective correct bids
      revealBidder1 = await blindAuction.reveal([toWei("0.1")], [true], [fromAscii("secret")], { from: bidder1 })
      revealBidder2 = await blindAuction.reveal([toWei("0.2"), toWei("0.05")], [true, false], [fromAscii("secret"), fromAscii("secret")], { from: bidder2 })
      // move time ahead by 10s so that can test onlyAfter & onlyBefore
      // for end auction to ensure it is after reveal time end
      await blindAuction.moveAheadRevealTime(21) // mock moving ahead by 21s (20s is time to reveal end)
      auctionEnd = await blindAuction.auctionEnd()
      // withdraw only can be executed after auction ends
      bidder1Withdraw = await blindAuction.withdraw({ from: bidder1 })
      bidder2Withdraw = await blindAuction.withdraw({ from: bidder2 })
    })
    it('send bid', async () => {
      const eventBid1 = bid1.logs[0].args
      assert.equal(eventBid1.bidHash, hashBid1, 'Bid1 Hashed bid should be hashbid passed in')
      assert.equal(eventBid1.deposit, toWei("0.1"), 'Bid1 Deposit should be 0.1 Ether')
      assert.equal(eventBid1.bidder, bidder1, 'Bid1 bidder should be bidder1')
      const eventBid2 = bid2.logs[0].args
      assert.equal(eventBid2.bidHash, hashBid2, 'Bid2 Hashed bid should be hashbid passed in')
      assert.equal(eventBid2.deposit, toWei("0.2"), 'Bid2 Deposit should be 0.2 Ether')
      assert.equal(eventBid2.bidder, bidder2, 'Bid2 bidder should be bidder2')
      const eventBid3 = bid3.logs[0].args
      assert.equal(eventBid3.bidHash, hashBid3, 'Bid3 Hashed bid should be hashbid passed in')
      assert.equal(eventBid3.deposit, toWei("0.25"), 'Bid3 Deposit should be 0.25 Ether (0.2 + 0.05)')
      assert.equal(eventBid3.bidder, bidder2, 'Bid3 bidder should be bidder2')
      // FAILURE: bid must have blinded bid content
      await blindAuction.bid("", bidder1).should.be.rejected;

    })

    it('reveal bid', async () => {
      const eventBidder1 = revealBidder1.logs[0].args
      const eventBidder2 = revealBidder2.logs[0].args
      assert.equal(eventBidder1.deposits, 0, 'Bidder 1 Deposits should be 0 as bid is highest at point of time')
      assert.equal(eventBidder1.isValid, true, "Reveal of bidder1 should be valid")
      assert.equal(eventBidder2.deposits, toWei("0.05"), 'Bidder 2 Deposits should be 0.05 as bid3 deposit should be returned')
      assert.equal(eventBidder2.isValid, true, "Reveal of bidder2 should be valid")
    })

    it('auction end', async () => {
      const event = auctionEnd.logs[0].args
      const highestBidder = await blindAuction.getHighestBidder()
      const highestBid = await blindAuction.getHighestBid()
      console.log(highestBid)
      console.log(highestBidder)
      assert.equal(event.winner, bidder2, 'Winner of auction should be bidder2')
      assert.equal(highestBidder, bidder2, 'getHighestBidder function should return bidder2')
      // NOTE: all ether values to be converted to Wei 
      assert.equal(event.highestBid, toWei("0.2"), 'Highest bid of auction should be 0.2')
      assert.equal(highestBid, toWei("0.2"), 'getHighestBid should return 0.2')
      assert.equal(event.currentValue, toWei('0.15'), 'Current value of contract should be 0.15 (0.1 from bidder1 + 0.05 from fake bid bidder 2)')
      // check if URL is registered in dns contract
      const urlAddress = await dns.getRegisteredURL(deployURL)
      assert.equal(event.winner, urlAddress, "Address of winner should be registered as owner in DNS manager")
      
    })

    it('withdraw', async () => {
      const eventBidder1 = bidder1Withdraw.logs[0].args
      const eventBidder2 = bidder2Withdraw.logs[0].args
      assert.equal(eventBidder1.amount, toWei("0.1"), 'Withdrawal bidder1 amount should be 0.1')
      assert.equal(eventBidder2.amount, toWei("0.05"), 'Withdrawal bidder2 amount should be 0.05')
    })

  })
})