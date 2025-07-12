// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Exam.sol";

contract TestExam is Exam {
    constructor(address _teacher, address _invigilator) Exam(_teacher, _invigilator) {}

    function registerStudentPublic(address payable _student) public {
        registerStudent(_student);
    }

    function submitExamPublic() public {
        submitExam();
    }

    function caughtCheatingPublic() public {
        caughtCheating();
    }
}
