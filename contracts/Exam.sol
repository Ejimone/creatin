// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


// this is a simple contract for an exam, questions and results
contract Exam {
    bool hasPaid; // if the user has paid for the exam
    uint256 score; // the score of the exam
    string[] questions;
    bool isExamOpen; // if the exam is open for taking
    bool isExamFinished; // if the exam is finished
    address payable owner; // the owner of the exam contract, will be able to recieve payments
    bytes32 examId; // unique identifier for the exam
    string examName; // name of the exam
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




    struct Question {
        string questionText; // the text of the question
        string[] options; // the options for the question
        uint256 correctOptionIndex; // the index of the correct option
    }


    struct Result {
        address participant; // the address of the participant
        uint256 score; // the score of the participant
        bool passed; // if the participant passed the exam
    }

    struct ExamDetails {
        bytes32 examId; // unique identifier for the exam
        string examName; // name of the exam
        string examDescription; // description of the exam
        uint256 examFee; // fee for taking the exam
        uint256 examDuration; // duration of the exam in seconds
        uint256 startTime; // start time of the exam
        uint256 endTime; // end time of the exam
        address teacher; // address of the teacher who created the exam
        address invigilator; // address of the invigilator for the exam
        address[] participants; // list of participants who have taken the exam
        Question[] questions; // list of questions in the exam
        Result[] results; // list of results for the participants
        bool isExamOpen; // if the exam is open for taking
        bool isExamFinished; // if the exam is finished
    }



    constructor(address _teacher, address _invigilator) {
        owner = payable(msg.sender);
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
    modifier onlyInvigilator() {
        require(msg.sender == invigilator, "only invigilator is permitted");
        _;
    }

    modifier examOpen() {
        require(isExamOpen, "exam is not open");
        _;
    }

    modifier onlyInvigilatorOrTeacher() {
        require(msg.sender == invigilator || msg.sender == teacher, "only invigilator or teacher is permitted");
        _;
    }

    modifier onlyOwnerOrTeacher() {
        require(msg.sender == owner || msg.sender == teacher, "only owner or teacher is permitted");
        _;
    }


    function registerStudent(address payable _student) internal onlyOwnerOrTeacher {
        require(_student != address(0), "invalid student address");
        require(student == address(0), "student already registered");
        require(!isExamOpen, "exam is already open");
        student = _student;
    }

    function openExam(uint256 _examFee, uint256 _examDuration, uint256 _startTime, uint256 _endTime) public onlyOwnerOrTeacher {
        require(!isExamOpen, "Exam is already open");
        require(_examFee > 0, "Exam fee must be greater than zero");
        require(_examDuration > 0, "Exam duration must be greater than zero");
        require(startTime < _endTime, "Start time must be before end time");
        require(block.timestamp < startTime, "Start time must be in the future");
        require(totalParticipants >= 1, "At least one participant must be registered");
        require(bytes(examName).length > 0, "Exam name must be set");
        examFee = _examFee;
        examDuration = _examDuration;
        startTime = _startTime;
        endTime = _endTime;
        isExamOpen = true;
        isExamFinished = false;
        examId = keccak256(abi.encodePacked(block.timestamp, owner, _examFee, _examDuration));
    }


    function closeExam() public onlyOwnerOrTeacher {
        require(isExamOpen, "Exam is not open");
        isExamOpen = false;
        isExamFinished = true;
        endTime = block.timestamp; // set end time to current time
    }

    function setExamDetails(string memory _examName, string memory _examDescription, uint256 _examFee, uint256 _examDuration, uint256 _startTime, uint256 _endTime) public onlyOwnerOrTeacher {
        require(!isExamOpen, "Exam is already open");
        require(_examFee > 0, "Exam fee must be greater than zero");
        require(_examDuration > 0, "Exam duration must be greater than zero");
        require(_startTime < _endTime, "Start time must be before end time");
        require(bytes(_examDescription).length > 0, "Exam description must not be empty");
        require(block.timestamp < _startTime, "Start time must be in the future");
        examName = _examName;
        examId = keccak256(abi.encodePacked(block.timestamp, owner, _examFee, _examDuration));
    }


    function startExam() public onlyStudent examOpen {
        require(!isExamFinished, "Exam is already finished");
        require(hasPaid, "Student has not paid for the exam");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Exam is not currently available");
        require(student == msg.sender, "Only registered student can start the exam");
        isExamOpen = true;
        startTime = block.timestamp; // set start time to current time
    }

}