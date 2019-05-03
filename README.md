# RFAI-Contracts
Request for AI Portal Smart Contracts

High Level Requirements:

1. Requesting for an AI Service

    A. Anyone should be able to request for a service in the RFAI DApp

    B. Requester can back the request using AGI tokens

    C. Service Request details will be available in IPFS and the hash will be in the RFAI block chain contract

    D. Every service request has an expiry

    E. When a new request is created it will be in the ppen State till its reviewed and approved by the foundation
  
2. Request Approval

    A. Request will be approved by designated members of the foundation (managed in the RFAI contract)

    B. Once approved request state changes to Aproved and is visible in the DApp for all to view. Its eligible for submissions from this point on
    C. During approval foundation member needs to provide following details:
      i. Submission duration in blocknumbers

      ii. Evaluation duration in blocknumbers

      iii. Expiration duration in case of any change from the expiration provide by the requestor
    
3. Backing a Request

    A. Anyone can back a service request once it has been approved by the foundation

    B. Backing is allowed for non expired service request until evaluation is completed

    C. Foundation members can also back any service request

4. Proposal or Solution Submission
  
    A. Only services registered on the SingularityNet platform can be submitted as a solution

    B. Submissions are only accepted during the submission phase as provide by the foundation (Refer Step-2)

    C. The submission must be signed by the same address used as the owner of the service on the SingularityNet platform

5. Voting for a Solution
  
    A. Foundation will vote to shortlist the submissions

    B. Users backing the service request can vote for any submission (not just the shortlisted ones)

    C. Only the users who are backing a service request can vote for the submission

    d. Validation of the solution will be performed offline. 
  
6. Claims
  
    A. Claims can be done only after the evaluation period and before the expiry period

    B. Solution submitter can claim any time before expiry of the request

    C. Claims will be caluculated based on the votes from backing users

      i. In case if there is no votes from any backing user, foundation votes are considered

    D. Claims will be distributed based on the number of votes either by backing users or by foundation members

7. Reclaiming Tokens
  
    A. AGI tokens used to back a service request can be reclaimed by the backer after the service request is expired
  
8. Close Request
  
    A. Only fondation can close a request.

    B. AGI Tokens used for backing will be returned to the backers

    C. Request status will change to Closed

