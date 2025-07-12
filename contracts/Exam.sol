// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


// this is a simple contract for an exam, questions and results
contract Exam {
    bool hasPaid; // if the user has paid for the exam
    uint256 score; // the score of the exam
    string[] questions;
    bool isExamOpen; // if the exam is open for taking
    bool isExamFinished; // if the exam is finished
    address owner; // the owner of the exam contract
    address[] participants; // list of participants who have taken the exam
    address teacher; // the teacher who created the exam
    address invigilator; // the invigilator for the exam
    address payable student; // the student taking the exam


    uint256 examFee; // the fee for taking the exam
    uint256 examDuration; // the duration of the exam in seconds
    uint256 startTime; // the start time of the exam
    uint256 endTime; // the end time of the exam
    uint256 maxScore; // the maximum score for the exam
    uint256 passScore; // the score required to pass the exam
    uint256 totalParticipants; // total number of participants who have taken the exam
    uint256[] results; // array to store results of participants


    constructor(address _teacher, address _invigilator) {
        owner = msg.sender;
        teacher = _teacher;
        invigilator = _invigilator;
        isExamOpen = false;
        isExamFinished = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner is permitted");
        _;
    }

    modifier onlyTeacher() {
        require(msg.sender == teacher, "only teacher is permitted");
        _;
    }

    modifier onlyStudent() {
        require (msg.sender == student, "only student is permitted");
        _;
    }
}