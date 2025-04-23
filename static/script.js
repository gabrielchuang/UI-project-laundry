function checkAnswers() {
    console.log("checkAnswers() called");
  
    // Debug correctAnswers
    if (!correctAnswers) {
      console.error("correctAnswers is not defined");
      alert("An error occurred. Please refresh the page.");
      return;
    }
    console.log("Correct answers:", correctAnswers);
  
    const form = document.getElementById('quiz-form');
    const questions = form.querySelectorAll('.question-block');
    let allCorrect = true;
    let allAnswered = true;
    let incorrectQuestions = [];
  
    console.log(`Found ${questions.length} questions`);
  
    questions.forEach((questionBlock, index) => {
      console.log(`Processing question ${index}`);
      const selectedOption = questionBlock.querySelector(`input[name="q${index}"]:checked`);
      const correctAnswer = correctAnswers[index];
      const labels = questionBlock.querySelectorAll('.form-check-label');
  
      if (!questionBlock.classList.contains('correct')) {
        labels.forEach(label => {
          label.style.color = 'black';
          label.style.backgroundColor = 'transparent';
        });
      }
  
      if (selectedOption) {
        const userAnswer = selectedOption.value;
        const selectedLabel = questionBlock.querySelector(`label[for="${selectedOption.id}"]`);
  
        if (userAnswer === correctAnswer) {
          console.log(`Question ${index} is correct`);
          selectedLabel.style.color = 'white';
          selectedLabel.style.backgroundColor = 'green';
          questionBlock.classList.add('correct');
        } else {
          console.log(`Question ${index} is incorrect`);
          selectedLabel.style.color = 'white';
          selectedLabel.style.backgroundColor = 'red';
          allCorrect = false;
          incorrectQuestions.push({ index, selectedOption, selectedLabel });
        }
      } else {
        console.log(`No option selected for question ${index}`);
        allAnswered = false;
      }
    });
  
    if (!allAnswered) {
      alert("Please select an answer for all questions.");
      return;
    }
  
    if (allCorrect) {
      console.log("All answers are correct!");
      alert("Congratulations! All answers are correct!");
    } else {
      console.log("Some answers are incorrect:", incorrectQuestions.map(q => q.index));
      incorrectQuestions.forEach(({ index, selectedOption, selectedLabel }) => {
        if (confirm(`Incorrect answer for question ${index + 1}. Would you like to try again?`)) {
          selectedOption.checked = false;
          selectedLabel.style.color = 'black';
          selectedLabel.style.backgroundColor = 'transparent';
        }
      });
    }
  }