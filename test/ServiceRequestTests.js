"use strict";
var  ServiceRequest = artifacts.require("./ServiceRequest.sol");

let Contract = require("@truffle/contract");
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
        //console.log("Catch Block: " + e.message);
    }
    assert(rezE >= 0, "Must generate error and error message must contain revert");
}
  
contract('ServiceRequest', function(accounts) {

    var serviceRequest;
    var tokenAddress;
    var token;
    let N1 = 42000 * 100000000
    let N2 = 420000 * 100000000
    let N3 = 42 * 100000000
    
    let GAmt = 10000  * 100000000;
    let Amt2 = 20  * 100000000;
    let Amt3 = 30 * 100000000;
    let Amt4 = 40 * 100000000;
    let Amt5 = 50 * 100000000;
    let Amt6 = 60 * 100000000;
    let Amt7 = 70 * 100000000;

    before(async () => 
        {
            serviceRequest = await ServiceRequest.deployed();
            tokenAddress = await serviceRequest.token.call();         
            token = await Token.at(tokenAddress);
        });

    const addAndVerifyFoundationMember = async(_newAccount, _role, _status, _account) => {

        await serviceRequest.addOrUpdateFoundationMembers(_newAccount, _role, _status, {from: _account});

        //const [role, status, exists] = await serviceRequest.foundationMembers.call(_newAccount);
        const {role, status, exists} = await serviceRequest.foundationMembers(_newAccount);

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

        await serviceRequest.createRequest(_amount,_expiration, web3.utils.asciiToHex(_documentURI), {from: _account});

        assert.equal((await serviceRequest.nextRequestId.call()).toNumber(), requestId_b.toNumber() + 1);
        assert.equal((await serviceRequest.balances.call(_account)).toNumber(), accountBal_b.toNumber() - _amount);

        const request_a = await serviceRequest.requests.call(requestId_b.toNumber());

    };

    const updateRequestAndVerify = async (_requestId, _expiration, _documentURI, _account) => {

        await serviceRequest.updateRequest(_requestId,_expiration, web3.utils.asciiToHex(_documentURI), {from: _account});

        const request_a = await serviceRequest.requests.call(_requestId);

        assert.equal(request_a.expiration.toNumber(), _expiration);
        assert.equal(web3.utils.hexToAscii(request_a.documentURI), _documentURI);

    };

    const extendRequestAndVerify = async(_requestId,  _expiration, _account) => {
        const request_b = await serviceRequest.requests.call(_requestId);

        await serviceRequest.extendRequest(_requestId, _expiration, {from: _account});

        const request_a = await serviceRequest.requests.call(_requestId);
        
        assert.equal(request_a.expiration.toNumber(), _expiration);
    };

    const approveRequestAndVerify = async (_requestId, _endSubmission, _endEvaluation, _expiration, _account) => {

        const foundationMembers0 = await serviceRequest.foundationMembers(_account);

        const request_b = await serviceRequest.requests.call(_requestId);
        
        await serviceRequest.approveRequest(_requestId, _endSubmission, _endEvaluation, _expiration, {from: _account});

        const request_a = await serviceRequest.requests.call(_requestId);

        assert.equal(request_a.expiration.toNumber(), _expiration);
        assert.equal(request_a.endSubmission.toNumber(), _endSubmission);
        assert.equal(request_a.endEvaluation.toNumber(), _endEvaluation);
        assert.equal(request_a.status.toNumber(), 1);

    };

    const addFundsAndValidate = async (_requestId, _amount, _account) => {

        const request_b = await serviceRequest.requests.call(_requestId);
        const bal_b = await serviceRequest.balances(_account);

        await serviceRequest.addFundsToRequest(_requestId, _amount, {from: _account});

        const request_a = await serviceRequest.requests.call(_requestId);
        const bal_a = await serviceRequest.balances(_account);

        assert.equal(request_a.totalFund.toNumber(), request_b.totalFund.toNumber() + _amount);
        assert.equal(bal_a.toNumber(), bal_b.toNumber() - _amount);

    };

    const voteAndVerify = async(_requestId,_submitter, _account) => {
        await serviceRequest.vote(_requestId, _submitter, {from: _account});
    };

    
    const claimAndVerify = async(_requestId, _account, _increasedAmt) => {

        const bal_b = await serviceRequest.balances.call(_account);
        await serviceRequest.requestClaim(_requestId, {from: _account});
        const bal_a = await serviceRequest.balances.call(_account);

        //console.log(bal_b.toNumber() + "=" + bal_a.toNumber());
        assert.equal(bal_a.toNumber(), bal_b.toNumber() + _increasedAmt);

        const request_a = await serviceRequest.requests.call(_requestId);

    };

    const claimStakeAndVerify = async(_requestId, _account, _increasedAmt) => {

        const bal_b = await serviceRequest.balances.call(_account);
        await serviceRequest.requestClaimBack(_requestId, {from: _account});
        const bal_a = await serviceRequest.balances.call(_account);

        //console.log(bal_b.toNumber() + "=" + bal_a.toNumber());
        assert.equal(bal_a.toNumber(), bal_b.toNumber() + _increasedAmt);
    };

    const mineBlocks = async(numOfBlocks) => {
        for(var i=0; i<= numOfBlocks; i++) {
            await token.approve(serviceRequest.address,GAmt+i+1, {from:accounts[0]}); 
        }
    };
    
    const rejectRequestAndVerify = async(_requestId, _account) => {

        await serviceRequest.rejectRequest(_requestId, {from: _account});

        const request_a = await serviceRequest.requests.call(_requestId);

        assert.equal(request_a.status.toNumber(), 2);
    };

    // ************************ Test Scenarios Starts From Here ********************************************

    it ("1. Initial Wallet Operation", async function()
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

        it ("2. Fondation Member Operations", async function(){

            // accounts[8], accounts[9] -> Foundation Members
            await addAndVerifyFoundationMember(accounts[9], 0, true, accounts[0]);

            // Check for non existance Foundation Member

            const foundationMembers1 = await serviceRequest.foundationMembers(accounts[8]);
            assert.equal(foundationMembers1.exists, false);

            // Add a new member
            await addAndVerifyFoundationMember(accounts[8], 1, true, accounts[0]);

            // Disable the Foundation Account accounts[8]
            await addAndVerifyFoundationMember(accounts[9], 0, false, accounts[0]);

            // Enable the Foundation Account accounts[8]
            await addAndVerifyFoundationMember(accounts[9], 0, true, accounts[8]);

            // Role=0 should not be able to add new member
            testErrorRevert(serviceRequest.addOrUpdateFoundationMembers(accounts[8], 1, true, {from: accounts[9]}));

            // At the end of these test accounts[8] => Role:1 and Accounts[9] => Role:0 will be active as Foundation Members

        });

        it("3. Initial Service Request Operations - Create Request", async function() 
        {
            
            // accounts[2] -> Request Creator
            // accounts[3], accounts[4], accounts[5] -> Solution Submiter
            // accounts[6] & accounts[7] -> Stakers
            // accounts[8] & accounts[9] -> Foundation Members

            // Create Service Request
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration = blockNumber + 100000;
            let documentURI = 'abcdefghijklmsnopqrstuvwxyz';

            await depositTokensToContract(2, 9, GAmt);
            await createRequestAndVerify(Amt2, expiration, documentURI, accounts[2]);

        });

        it("4. Initial Service Request Operations - Extend Request", async function(){

            let newexpiration = 200000;
            await extendRequestAndVerify(0, newexpiration, accounts[2]);

            // Check the negative test cases
            testErrorRevert(serviceRequest.extendRequest(0, newexpiration-1000, {from: accounts[2]})); // Less 
            testErrorRevert(serviceRequest.extendRequest(0, newexpiration+1000, {from: accounts[3]})); // Diff account to extend

        });

        it("5. Initial Service Request Operations - Approve Request", async function(){
            
            let newexpiration = 300000;
            approveRequestAndVerify(0, newexpiration-200000, newexpiration-100000, newexpiration, accounts[8]);

        });

        it("5.1 Initial Service Request Operations - Load Funds into Request", async function(){ 
            
            await addFundsAndValidate(0, Amt6, accounts[6]);
            await addFundsAndValidate(0, Amt7, accounts[7]);

        });

        it("6. Initial Service Request Operations - Submit Solution to Request", async function(){ 
            
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(0, web3.utils.asciiToHex(solutionDocURI), {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(0, web3.utils.asciiToHex(solutionDocURI), {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(0, web3.utils.asciiToHex(solutionDocURI), {from: accounts[5]});

            const request0 = await serviceRequest.requests.call(0);

        });

        it("7. Initial Service Request Operations - Force Close Request", async function(){ 
            
            const a2Bal_b = await serviceRequest.balances(accounts[2]);
            const a6Bal_b = await serviceRequest.balances(accounts[6]);
            const a7Bal_b = await serviceRequest.balances(accounts[7]);

            await serviceRequest.closeRequest(0, {from: accounts[8]});
            const request = await serviceRequest.requests.call(0);
            
            await serviceRequest.requestClaimBack(0, {from: accounts[2]});
            await serviceRequest.requestClaimBack(0, {from: accounts[6]});
            await serviceRequest.requestClaimBack(0, {from: accounts[7]});

            const a2Bal_a = await serviceRequest.balances(accounts[2]);
            const a6Bal_a = await serviceRequest.balances(accounts[6]);
            const a7Bal_a = await serviceRequest.balances(accounts[7]);

            assert.equal(request.status.toNumber(), 4);
            assert.equal(a2Bal_a.toNumber(), a2Bal_b.toNumber() + Amt2);
            assert.equal(a6Bal_a.toNumber(), a6Bal_b.toNumber() + Amt6);
            assert.equal(a7Bal_a.toNumber(), a7Bal_b.toNumber() + Amt7);

            // This test should fail as we cant fund to a closed request
            await testErrorRevert(serviceRequest.addFundsToRequest(0, Amt6, {from: accounts[6]}));
            
        });

        it("8. Service Request Operations - Vote and Claim Request", async function(){

            // Create Service Request
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let endSubmission_i = blockNumber + 25;
            let endEvaluation_i = blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, web3.utils.asciiToHex(documentURI_i), accounts[2]);

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Add Funds to the request
            await addFundsAndValidate(requestId_i, Amt6, accounts[6]);
            await addFundsAndValidate(requestId_i, Amt7, accounts[7]);
            
            // Submit the solutions
            let solutionDocURI = 'aaalllssllddffgghhjjj';
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[5]});

            // Mine to Increase the blocknumber
            const request_a = await serviceRequest.requests.call(requestId_i);
            await mineBlocks(request_a.endSubmission.toNumber() - blockNumber);

            // Foundation Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[8]);
            await voteAndVerify(requestId_i, accounts[5], accounts[8]);

            // Stake Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[6]);
            await voteAndVerify(requestId_i, accounts[4], accounts[6]);
            await voteAndVerify(requestId_i, accounts[5], accounts[6]);

            // Mine to Increase the blocknumber
            await mineBlocks(request_a.endEvaluation.toNumber() - blockNumber);

            // Request Claim
            await claimAndVerify(requestId_i, accounts[3], (Amt6/3) + (Amt7/2) + (Amt2/2));
            await claimAndVerify(requestId_i, accounts[4], (Amt6/3));
            await claimAndVerify(requestId_i, accounts[5], (Amt6/3) + (Amt7/2) + (Amt2/2));

            // Should fail if we try to claim again
            await testErrorRevert(serviceRequest.requestClaim(requestId_i, {from: accounts[3]}));

        });

        it("9. Service Request Operations - Expiry and ReClaim Stake Request", async function(){

            // Create Service Request
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let endSubmission_i = blockNumber + 25;
            let endEvaluation_i = blockNumber + 50;
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
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[3]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[4]});
            await serviceRequest.createOrUpdateSolutionProposal(requestId_i, web3.utils.asciiToHex(solutionDocURI), {from: accounts[5]});

            // Mine to Increase the blocknumber
            const request_a = await serviceRequest.requests.call(requestId_i);
            await mineBlocks(request_a.endSubmission.toNumber() - blockNumber);

            // Foundation Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[8]);
            await voteAndVerify(requestId_i, accounts[5], accounts[8]);

            // Stake Votes
            await voteAndVerify(requestId_i, accounts[3], accounts[6]);
            await voteAndVerify(requestId_i, accounts[4], accounts[6]);

            // Mine to Increase the blocknumber
            await mineBlocks(request_a.endEvaluation.toNumber() - blockNumber);

            // No Claim Happend from the submitters and making request expired to enable reclaim
            await mineBlocks(request_a.expiration.toNumber() - blockNumber);
            await claimStakeAndVerify(requestId_i, accounts[6], Amt6);
            await claimStakeAndVerify(requestId_i, accounts[7], Amt7);

            // Should fail if we try to claim again
            await testErrorRevert(serviceRequest.requestClaim(requestId_i, {from: accounts[3]}));

        });

        
        it("10. Service Request Operations - Reject Request", async function(){

            // Create Service Request
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let endSubmission_i = blockNumber + 25;
            let endEvaluation_i = blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            const a2Bal_b = await serviceRequest.balances(accounts[2]);

            await createRequestAndVerify(Amt2,expiration_i, web3.utils.asciiToHex(documentURI_i), accounts[2]);

            // Reject the request
            await rejectRequestAndVerify(requestId_i, accounts[9]);

            // Reclaim the initial stake while creating the request
            await serviceRequest.requestClaimBack(requestId_i, {from: accounts[2]});

            const a2Bal_a = await serviceRequest.balances(accounts[2]);

            assert.equal(a2Bal_a.toNumber(), a2Bal_b.toNumber());

        });

        
        it("10.1 Initial Service Request Operations - Owner Close Request", async function(){ 
            
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            const a2Bal_b = await serviceRequest.balances(accounts[2]);

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, web3.utils.asciiToHex(documentURI_i), accounts[2]);

            await serviceRequest.closeRequest(requestId_i, {from: accounts[2]});

            const request = await serviceRequest.requests.call(requestId_i);
            
            assert.equal(Amt2, request.totalFund.toNumber());

            await serviceRequest.requestClaimBack(requestId_i, {from: accounts[2]});

            const a2Bal_a = await serviceRequest.balances(accounts[2]);

            assert.equal(request.status.toNumber(), 4);
            assert.equal(a2Bal_a.toNumber(), a2Bal_b.toNumber());
            
        });

        it("10.2 Initial Service Request Operations - Multiple stake by Owner to request", async function(){ 
            
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let endSubmission_i = blockNumber + 25;
            let endEvaluation_i = blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            const a2Bal_b = await serviceRequest.balances(accounts[2]);

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, web3.utils.asciiToHex(documentURI_i), accounts[2]);

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Add Funds to the request
            let amtLTMinStake = 10000000 // This amount is less than MinStake in the Contract
            await addFundsAndValidate(requestId_i, amtLTMinStake, accounts[2]);

            const request = await serviceRequest.requests.call(requestId_i);
            
            assert.equal(Amt2 + amtLTMinStake, request.totalFund.toNumber());

            const a2Bal_a = await serviceRequest.balances(accounts[2]);

            assert.equal(request.status.toNumber(), 1);
            assert.equal(a2Bal_a.toNumber() + Amt2 + amtLTMinStake, a2Bal_b.toNumber());
            
        });

        it("11. Update request by respective owner in Open State", async function(){ 
            
            let blockNumber = await web3.eth.getBlockNumber();
            let expiration_i = blockNumber + 90;
            let endSubmission_i = blockNumber + 25;
            let endEvaluation_i = blockNumber + 50;
            let documentURI_i = 'abcdefghijklmsnopqrstuvwxyz';

            const a2Bal_b = await serviceRequest.balances(accounts[2]);

            let requestId_i = (await serviceRequest.nextRequestId.call()).toNumber();

            await createRequestAndVerify(Amt2,expiration_i, web3.utils.asciiToHex(documentURI_i), accounts[2]);

            // Updated Values to test the Update Request
            expiration_i = expiration_i + 90;
            documentURI_i = 'ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B';

            // Update the Request by Non Create - Should fail
            testErrorRevert(serviceRequest.updateRequest(requestId_i, expiration_i, web3.utils.asciiToHex(documentURI_i), {from: accounts[3]}));

            // Update the Request
            await updateRequestAndVerify(requestId_i, expiration_i, documentURI_i, accounts[2])

            // Approve the request
            let newexpiration = expiration_i+10;
            await approveRequestAndVerify(requestId_i, endSubmission_i, endEvaluation_i, newexpiration, accounts[8]);

            // Updated Values to test the Update Request
            expiration_i = expiration_i + 90;
            documentURI_i = 'ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B';

            // Update the Request by In Approved State by the requester - Should fail
            await testErrorRevert(serviceRequest.updateRequest(requestId_i, expiration_i, web3.utils.asciiToHex(documentURI_i), {from: accounts[2]}));
            
        });

});
