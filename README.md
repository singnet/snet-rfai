# RFAI-Contracts
Request for AI Portal Smart Contracts



High Level Requirements:

1. Request for AI Service

    A. Anyone should be able to request for a service in the Web Portal
  
    B. Requester can stake on the Service Request
  
    c. Service Request details will be available in IPFS and the hash will be in BlockChain Contract
  
    d. There is an expiry for the Service Request
  
    E. When a new requested is created it will be in a Open State until foundation is Approved
  
    F. Requester can extend the request only when it is not approved means in Open state
  
2. Request Approval

    A. Request will be approved by any member from Foundation which is managed in the Contract
  
    B. Once approved request state changes to Aproved and available to accept the submissions
  
    C. During approval foundation needs to provide following details:
  
      i. Submission duration in blocknumbers
      
      ii. Evaluation duration in blocknumbers
      
      iii. Expiration duration in case of any change from the expiration provide by the requestor
    
3. Staking into Request

    A. Anyone can stake into the request when the request is approved by the foundation
  
    B. Stake will be accepted for a non expired request untill evaluation completed
  
    C. Even foundation members can also stake into the request

4. Proposal or Solution Submission
  
    A. Anyone can submit the solution for a given request which is ready to accept the submissions
  
    B. Solution are accepted only during the submission phase as provide by the foundation (Refer Step-2)

5. Voting a Solution
  
    A. Foundation will vote to shortlist the submissions
    
    B. Staking users can vote to any submission not only to shortlisted ones
    
    C. Right now only the users who has stake in the respective request can vote for the submission

    d. Validation of the solution will be performed offline. Solution will be available as part of Marketplace.
  
6. Claims
  
    A. Claims can be done only after the evaluation
    
    B. Solution submitter can claim any time before expiry of the request
    
    C. Claims will be caluculated based on the votes from staking users
      
      i. In case if there is no votes from staking user, foundation votes are considered
  
    D. Claims will be distributed based on the number of votes either by staking user or by foundation members
  
    E. Foundation member stake will be distributed as per the respective member shortlisting

7. Stake Reclaim
  
    A. Staking users can reclaim the stake only when the request is expired
    
    B. No solution submitter can claim when the request is expired
  
8. Close Request
  
    A. Only fondation can forcible close the request even after the approval
    
    B. Stakes will be given back to the respective stakers of the request
    
    C. Request status will changed to Closed

