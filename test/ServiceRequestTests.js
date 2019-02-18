"use strict";
var  ServiceRequest = artifacts.require("./ServiceRequest.sol");

let Contract = require("truffle-contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});
Token.setProvider(web3.currentProvider);

var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');

async function testErrorRevert(prom)
{
    let rezE = -1
    try { await prom }
    catch(e) {
        rezE = e.message.indexOf('revert');
        console.log("Catch Block: " + e.message);
    }
    assert(rezE >= 0, "Must generate error and error message must contain revert");
}
  
contract('ServiceRequest', function(accounts) {

    var serviceRequest;
    var tokenAddress;
    var token;
    let N1 = 42000
    let N2 = 420000
    let N3 = 42
    
    let GAmt = 10000;
    let Amt2 = 20;
    let Amt3 = 30;
    let Amt4 = 40;
    let Amt5 = 50;
    let Amt6 = 60;
    let Amt7 = 70;

    before(async () => 
        {
            serviceRequest = await ServiceRequest.deployed();
            tokenAddress = await serviceRequest.token.call();
            token = Token.at(tokenAddress);
        });

    const addAndVerifyFoundationMember = async(_newAccount, _role, _status, _account) => {

        await serviceRequest.addOrUpdateFoundationMembers(_newAccount, _role, _status, {from: _account});

        const [role, status, exists] = await serviceRequest.foundationMembers.call(_newAccount);
        assert.equal(exists, true);
        assert.equal(status, _status);

    };

    const depositTokensToContract = async(_startAccountIndex, _endAccountIndex, _depositAmt) => {
        // Deposit amount to respective accounts
        for(var i=_startAccountIndex;i<_endAccountIndex;i++) {
            await token.transfer(accounts[i],  _depositAmt, {from:accounts[0]});
            await token.approve(serviceRequest.address,_depositAmt, {from:accounts[i]}); 
            await serviceRequest.deposit(_depositAmt, {from:accounts[i]});
        }
    };

    const createRequestAndVerify = async (_amount, _expiration, _documentURI, _account) => {

        const requestId_b = await serviceRequest.nextRequestId.call();
        const accountBal_b = await serviceRequest.balances.call(_account);

        await serviceRequest.createRequest(_amount,_expiration, _documentURI, {from: _account});

        assert.equal((await serviceRequest.nextRequestId.call()).toNumber(), requestId_b.toNumber() + 1);
        assert.equal((await serviceRequest.balances.call(_account)).toNumber(), accountBal_b.toNumber() - _amount);

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(requestId_b.toNumber());

        console.log("create -- " + requestId_a.toNumber() + "," + requester_a + "," +  totalFund_a.toNumber() + "," +  documentURI_a + "," +  expiration_a.toNumber() + "," +  endSubmission_a.toNumber() + "," +  endEvaluation_a.toNumber() + "," +  status_a.toNumber());
        console.log("Creator -- " + _account);

    };

    const extendRequestAndVerify = async(_requestId,  _expiration, _account) => {
        const [requestId_b, requester_b, totalFund_b, documentURI_b, expiration_b, endSubmission_b, endEvaluation_b, status_b]
        = await serviceRequest.requests.call(_requestId);

        await serviceRequest.extendRequest(_requestId, _expiration, {from: _account});

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(_requestId);
        
        assert.equal(expiration_a.toNumber(), _expiration);
    };

    const approveRequestAndVerify = async (_requestId, _endSubmission, _endEvaluation, _expiration, _account) => {

        const [role0, status0, exists0] = await serviceRequest.foundationMembers.call(_account);
        //console.log("Mem Status " + status0);

        const [requestId_b, requester_b, totalFund_b, documentURI_b, expiration_b, endSubmission_b, endEvaluation_b, status_b]
        = await serviceRequest.requests.call(_requestId);
        
        await serviceRequest.approveRequest(_requestId, _endSubmission, _endEvaluation, _expiration, {from: _account});

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(_requestId);

        console.log("approve-- " + requestId_a.toNumber() + "," + requester_a + "," +  totalFund_a.toNumber() + "," +  documentURI_a + "," +  expiration_a.toNumber() + "," +  endSubmission_a.toNumber() + "," +  endEvaluation_a.toNumber() + "," +  status_a.toNumber());

        assert.equal(expiration_a.toNumber(), _expiration);
        assert.equal(endSubmission_a.toNumber(), _endSubmission);
        assert.equal(endEvaluation_a.toNumber(), _endEvaluation);
        assert.equal(status_a.toNumber(), 1);

    };

    const addFundsAndValidate = async (_requestId, _amount, _account) => {

        const [requestId_b, requester_b, totalFund_b, documentURI_b, expiration_b, endSubmission_b, endEvaluation_b, status_b]
        = await serviceRequest.requests.call(_requestId);

        const bal_b = await serviceRequest.balances.call(_account);

        await serviceRequest.addFundsToRequest(_requestId, _amount, {from: _account});

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(_requestId);

        const bal_a = await serviceRequest.balances.call(_account);

        assert.equal(totalFund_a.toNumber(), totalFund_b.toNumber() + _amount);
        assert.equal(bal_a.toNumber(), bal_b.toNumber() - _amount);
        
        // To be deleted
        console.log("Funds -- " + requestId_a.toNumber() + "," + requester_a + "," +  totalFund_a.toNumber() + "," +  documentURI_a + "," +  expiration_a.toNumber() + "," +  endSubmission_a.toNumber() + "," +  endEvaluation_a.toNumber() + "," +  status_a.toNumber());

    };

    const voteAndVerify = async(_requestId,_submitter, _account) => {
        await serviceRequest.vote(_requestId, _submitter, {from: _account});
    };

    
    const claimAndVerify = async(_requestId, _account, _increasedAmt) => {

        const bal_b = await serviceRequest.balances.call(_account);
        await serviceRequest.requestClaim(_requestId, {from: _account});
        const bal_a = await serviceRequest.balances.call(_account);

        console.log(bal_b.toNumber() + "=" + bal_a.toNumber());
        assert.equal(bal_a.toNumber(), bal_b.toNumber() + _increasedAmt);

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(_requestId);
        console.log("claim -- " + requestId_a.toNumber() + "," + requester_a + "," +  totalFund_a.toNumber() + "," +  documentURI_a + "," +  expiration_a.toNumber() + "," +  endSubmission_a.toNumber() + "," +  endEvaluation_a.toNumber() + "," +  status_a.toNumber());

    };

    const claimStakeAndVerify = async(_requestId, _account, _increasedAmt) => {

        const bal_b = await serviceRequest.balances.call(_account);
        await serviceRequest.requestClaimBack(_requestId, {from: _account});
        const bal_a = await serviceRequest.balances.call(_account);

        console.log(bal_b.toNumber() + "=" + bal_a.toNumber());
        assert.equal(bal_a.toNumber(), bal_b.toNumber() + _increasedAmt);
    };

    const mineBlocks = async(numOfBlocks) => {
        for(var i=0; i<= numOfBlocks; i++) {
            await token.approve(serviceRequest.address,GAmt+i+1, {from:accounts[0]}); 
        }
    };
    
    const rejectRequestAndVerify = async(_requestId, _account) => {

        await serviceRequest.rejectRequest(_requestId, {from: _account});

        const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
        = await serviceRequest.requests.call(_requestId);

        assert.equal(status_a.toNumber(), 2);
    };

    // ************************ Test Scenarios Starts From Here ********************************************

    it ("Initial Wallet Operation 1", async function()
        { 
            // accounts[0] and accounts[1] are used for this testing
            //Deposit 42000 from accounts[0]
            await token.approve(serviceRequest.address,N1, {from:accounts[0]});
            await serviceRequest.deposit(N1, {from:accounts[0]});
            assert.equal((await serviceRequest.balances.call(accounts[0])).toNumber(), N1)

            //Deposit 420000 from accounts[1] (frist we need transfert from a[0] to a[4])
            await token.transfer(accounts[1],  N2, {from:accounts[0]});
            await token.approve(serviceRequest.address,N2, {from:accounts[1]}); 
            await serviceRequest.deposit(N2, {from:accounts[1]});
            
            assert.equal((await serviceRequest.balances.call(accounts[1])).toNumber(), N2)

            assert.equal((await token.balanceOf(serviceRequest.address)).toNumber(), N1 + N2)
           
            //try to withdraw more than we have
            await testErrorRevert(serviceRequest.withdraw(N2 + 1, {from:accounts[1]}))
            
            serviceRequest.withdraw(N3, {from:accounts[1]})
            assert.equal((await serviceRequest.balances.call(accounts[1])).toNumber(), N2 - N3)
            assert.equal((await token.balanceOf(serviceRequest.address)).toNumber(), N1 + N2 - N3)
            assert.equal((await token.balanceOf(accounts[1])).toNumber(), N3)

        }); 

        it ("Fondation Member Operations 2", async function(){

            // accounts[8], accounts[9] -> Foundation Members
            await addAndVerifyFoundationMember(accounts[9], 0, true, accounts[0]);

            // Check for non existance Foundation Member
            const [role1, status1, exists1] = await serviceRequest.foundationMembers.call(accounts[8]);
            assert.equal(exists1, false);

            // Add a new member
            await addAndVerifyFoundationMember(accounts[8], 1, true, accounts[0]);

            // Disable the Foundation Account accounts[8]
            await addAndVerifyFoundationMember(accounts[9], 0, false, accounts[0]);

            // Enable the Foundation Account accounts[8]
            await addAndVerifyFoundationMember(accounts[9], 0, true, accounts[8]);

            // Role=0 should not be able to add new member
            //testErrorRevert(await serviceRequest.addOrUpdateFoundationMembers(accounts[8], 1, true, {from: accounts[9]}));

            // At the end of these test accounts[8] => Role:1 and Accounts[9] => Role:0 will be active as Foundation Members

        });      

        it("Initial Service Request Operations - Create Request 3", async function() 
        {
            
            // accounts[2] -> Request Creator
            // accounts[3], accounts[4], accounts[5] -> Solution Submiter
            // accounts[6] & accounts[7] -> Stakers
            // accounts[8] & accounts[9] -> Foundation Members

            // Create Service Request
            let expiration = web3.eth.blockNumber + 100000;
            let documentURI = 'abcdefghijklmsnopqrstuvwxyz';

            await depositTokensToContract(2, 9, GAmt);
            await createRequestAndVerify(Amt2, expiration, documentURI, accounts[2]);

        });

        it("Initial Service Request Operations - Extend Request 4", async function(){

            let newexpiration = 200000;
            await extendRequestAndVerify(0, newexpiration, accounts[2]);

            // Check the negative test cases
            //testErrorRevert(await serviceRequest.extendRequest(0, newexpiration-1000, {from: accounts[2]})); // Less 
            //testErrorRevert(await serviceRequest.extendRequest(0, newexpiration+1000, {from: accounts[3]})); // Diff account to extend

        });

        it("Initial Service Request Operations - Approve Request 5", async function(){
            
            let newexpiration = 300000;
            approveRequestAndVerify(0, newexpiration-200000, newexpiration-100000, newexpiration, accounts[8]);

        });

        it("Initial Service Request Operations - Load Funds into Request 5", async function(){ 
            
            await addFundsAndValidate(0, Amt6, accounts[6]);
            await addFundsAndValidate(0, Amt7, accounts[7]);

        });

        it("Initial Service Request Operations - Submit Solution to Request 6", async function(){ 
            
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(0, solutionDocURI, {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(0, solutionDocURI, {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(0, solutionDocURI, {from: accounts[5]});

            const [requestId, requester, totalFund, documentURI, expiration, endSubmission, endEvaluation, status]
            = await serviceRequest.requests.call(0);

        });

        it("Initial Service Request Operations - Force Close Request 7", async function(){ 
            
            const a2Bal_b = await serviceRequest.balances.call(accounts[2]);
            const a6Bal_b = await serviceRequest.balances.call(accounts[6]);
            const a7Bal_b = await serviceRequest.balances.call(accounts[7]);

            await serviceRequest.closeRequest(0, {from: accounts[8]});
            const [requestId, requester, totalFund, documentURI, expiration, endSubmission, endEvaluation, status]
            = await serviceRequest.requests.call(0);

            console.log(requestId.toNumber() + "," + requester + "," +  totalFund.toNumber() + "," +  documentURI + "," +  expiration.toNumber() + "," +  endSubmission.toNumber() + "," +  endEvaluation.toNumber() + "," +  status.toNumber());
            
            await serviceRequest.requestClaimBack(0, {from: accounts[2]});
            await serviceRequest.requestClaimBack(0, {from: accounts[6]});
            await serviceRequest.requestClaimBack(0, {from: accounts[7]});

            const a2Bal_a = await serviceRequest.balances.call(accounts[2]);
            const a6Bal_a = await serviceRequest.balances.call(accounts[6]);
            const a7Bal_a = await serviceRequest.balances.call(accounts[7]);

            assert.equal(status.toNumber(), 4);
            assert.equal(a2Bal_a.toNumber(), a2Bal_b.toNumber() + Amt2);
            assert.equal(a6Bal_a.toNumber(), a6Bal_b.toNumber() + Amt6);
            assert.equal(a7Bal_a.toNumber(), a7Bal_b.toNumber() + Amt7);

            // This test should fail as we cant fund to a closed request
            //testErrorRevert(await serviceRequest.addFundsToRequest(0, Amt6, {from: accounts[6]}));
            
        });
        
        it("Service Request Operations - Vote and Claim Request 8", async function(){

            // Create Service Request
            let expiration_i = web3.eth.blockNumber + 90;
            let endSubmission_i = web3.eth.blockNumber + 25;
            let endEvaluation_i = web3.eth.blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, documentURI_i, accounts[2]);

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Add Funds to the request
            await addFundsAndValidate(requestId_i, Amt6, accounts[6]);
            await addFundsAndValidate(requestId_i, Amt7, accounts[7]);
            
            // Submit the solutions
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[5]});

            // Mine to Increase the blocknumber
            const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
            = await serviceRequest.requests.call(requestId_i);
            await mineBlocks(endSubmission_a.toNumber() - web3.eth.blockNumber);

            // Foundation Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[8]);
            await voteAndVerify(requestId_i, accounts[5], accounts[8]);

            // Stake Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[6]);
            await voteAndVerify(requestId_i, accounts[4], accounts[6]);
            await voteAndVerify(requestId_i, accounts[5], accounts[6]);

            // Mine to Increase the blocknumber
            await mineBlocks(endEvaluation_a.toNumber() - web3.eth.blockNumber);

            // Request Claim
            await claimAndVerify(requestId_i, accounts[3], (Amt6/3) + (Amt7/2) + (Amt2/2));
            await claimAndVerify(requestId_i, accounts[4], (Amt6/3));
            await claimAndVerify(requestId_i, accounts[5], (Amt6/3) + (Amt7/2) + (Amt2/2));

            // Should fail if we try to claim again
            //testErrorRevert(await serviceRequest.requestClaim(requestId_i, {from: accounts[3]}));

        });

        it("Service Request Operations - Expiry and ReClaim Stake Request 9", async function(){

            // Create Service Request
            let expiration_i = web3.eth.blockNumber + 90;
            let endSubmission_i = web3.eth.blockNumber + 25;
            let endEvaluation_i = web3.eth.blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, documentURI_i, accounts[2]);

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Add Funds to the request
            await addFundsAndValidate(requestId_i, Amt6, accounts[6]);
            await addFundsAndValidate(requestId_i, Amt7, accounts[7]);
            
            // Submit the solutions
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[5]});

            // Mine to Increase the blocknumber
            const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
            = await serviceRequest.requests.call(requestId_i);
            await mineBlocks(endSubmission_a.toNumber() - web3.eth.blockNumber);

            // Foundation Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[8]);
            await voteAndVerify(requestId_i, accounts[5], accounts[8]);

            // Stake Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[6]);
            await voteAndVerify(requestId_i, accounts[4], accounts[6]);

            // Mine to Increase the blocknumber
            await mineBlocks(endEvaluation_a.toNumber() - web3.eth.blockNumber);

            // No Claim Happend from the submitters and making request expired to enable reclaim
            await mineBlocks(expiration_a.toNumber() - web3.eth.blockNumber);
            await claimStakeAndVerify(requestId_i, accounts[6], Amt6);
            await claimStakeAndVerify(requestId_i, accounts[7], Amt7);

            // Should fail if we try to claim again
            //testErrorRevert(await serviceRequest.requestClaim(requestId_i, {from: accounts[3]}));

        });
        
        it("Service Request Operations - Reject Request 10", async function(){

            // Create Service Request
            let expiration_i = web3.eth.blockNumber + 90;
            let endSubmission_i = web3.eth.blockNumber + 25;
            let endEvaluation_i = web3.eth.blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            const a2Bal_b = await serviceRequest.balances.call(accounts[2]);

            await createRequestAndVerify(Amt2,expiration_i, documentURI_i, accounts[2]);

            // Reject the request
            await rejectRequestAndVerify(requestId_i, accounts[9]);

            // Reclaim the initial stake while creating the request
            await serviceRequest.requestClaimBack(requestId_i, {from: accounts[2]});

            const a2Bal_a = await serviceRequest.balances.call(accounts[2]);

            assert.equal(a2Bal_a.toNumber(), a2Bal_b.toNumber());

        });
        
        /*
        it("Load Testing - Multiple Operations 11.0", async function() {

            await depositTokensToContract(10, 999, 1000);

        });

        it("Load Testing - Multiple Operations 11.1", async function() {

            // Create Service Request
            let expiration_i = web3.eth.blockNumber + 4500;
            let endSubmission_i = web3.eth.blockNumber + 1500;
            let endEvaluation_i = web3.eth.blockNumber + 3000;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, documentURI_i, accounts[2]);

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Add Funds to the request
            for(var i=10; i<1000; i++){
                await addFundsAndValidate(requestId_i, i-9, accounts[i]);
            }

        });
        
        it("Load Testing - Multiple Operations 11.2", async function() {

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber() - 1;

            // Submit the solutions
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, solutionDocURI, {from: accounts[5]});

            // Mine to Increase the blocknumber
            const [requestId_a, requester_a, totalFund_a, documentURI_a, expiration_a, endSubmission_a, endEvaluation_a, status_a]
            = await serviceRequest.requests.call(requestId_i);
            await mineBlocks(endSubmission_a.toNumber() - web3.eth.blockNumber);

            // Foundation Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[8]);
            await voteAndVerify(requestId_i, accounts[5], accounts[8]);

            // Stake Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[6]);
            await voteAndVerify(requestId_i, accounts[4], accounts[6]);
            await voteAndVerify(requestId_i, accounts[5], accounts[6]);

            // Mine to Increase the blocknumber
            await mineBlocks(endEvaluation_a.toNumber() - web3.eth.blockNumber);

            // Request Claim
            const a3Bal_b = await serviceRequest.balances.call(accounts[3]);
            await serviceRequest.requestClaim(requestId_i, {from: accounts[3]});
            const a3Bal_a = await serviceRequest.balances.call(accounts[3]);
            console.log(a3Bal_b + "=======" + a3Bal_a);
            
            
            const a10Bal_b = await serviceRequest.balances.call(accounts[10]);

            // Force Close the Request to check
            //await serviceRequest.closeRequest(requestId_i, {from: accounts[8]});
            

            const a10Bal_a = await serviceRequest.balances.call(accounts[10]);

            console.log(a10Bal_b + "=======" + a10Bal_a);
            

        });
        */
});
