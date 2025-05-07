function checkAnswers() {
    console.log("Checking answers...");
    const form = document.getElementById('quiz-form');
    const questions = form.querySelectorAll('.question-block');
    let allAnswered = true;

    questions.forEach((questionBlock, index) => {
        const selectedOption = questionBlock.querySelector(`input[name="q${index}"]:checked`);
        if (!selectedOption) {
            allAnswered = false;
            questionBlock.style.border = "2px solid red";
        } else {
            questionBlock.style.border = "none";
        }
    });

    if (!allAnswered) {
        alert("Please select an answer for all questions.");
        return false; // Prevent form submission
    }

    return true; // Allow form submission
}

$(document).ready(function () {
    // Quiz page initialization
    const quizId = window.location.pathname.split('/').pop();
    const totalQuestions = parseInt($('#total-questions').text() || '0');
    let currentQuestion = 0;

    // If we're on a quiz page
    if (totalQuestions > 0) {
        // Initialize quiz
        updateNavigation();

        // Event handlers
        $('#next-btn').click(goToNextQuestion);
        $('#prev-btn').click(goToPreviousQuestion);
    }

    
    $('.embedded-quiz-form').each(function() {
        const $form = $(this);
        // Include both .question-container and .wash-panel-question in the count
        const $questions = $form.find('.question-container, .wash-panel-question, .drag-drop-question');
        const totalEmbeddedQuestions = $questions.length;
        let currentEmbeddedQuestion = 0;
    
        // Debug: Log the number of questions and their types
        console.log("Total embedded questions:", totalEmbeddedQuestions);
        $questions.each(function(index) {
            console.log(`Question ${index}:`, $(this).hasClass('question-container') ? 'Multiple Choice' : $(this).hasClass('wash-panel-question') ? 'Wash Panel' : 'Drag and Drop');
        });
    
        // Set up navigation handlers for this embedded quiz
        $form.find('.quiz-next-btn').click(function() {
            if (validateEmbeddedQuestion($form, currentEmbeddedQuestion)) {
                navigateEmbeddedQuestion($form, currentEmbeddedQuestion + 1);
            }
        });
    
        $form.find('.quiz-prev-btn').click(function() {
            navigateEmbeddedQuestion($form, currentEmbeddedQuestion - 1);
        });
    
        $form.find('.quiz-submit-btn').click(function (e) {
            let allAnswered = true;
            // Validate all questions in the quiz
            for (let i = 0; i < totalEmbeddedQuestions; i++) {
                if (!validateEmbeddedQuestion($form, i)) {
                    allAnswered = false;
                    navigateEmbeddedQuestion($form, i); // Navigate to the first unanswered question
                    break;
                }
            }
    
            if (allAnswered) {
                console.log("Submitting form with data:", $form.serializeArray());
                $form.submit();
            } else {
                alert("Please answer all questions before submitting.");
            }
        });
    
        // Initialize navigation state
        updateEmbeddedNavigation($form, currentEmbeddedQuestion, totalEmbeddedQuestions);
    
        // Helper function to navigate between questions in embedded quiz
        function navigateEmbeddedQuestion($form, index) {
            // Validate index range
            if (index < 0 || index >= totalEmbeddedQuestions) return;
    
            // Hide current question
            $form.find('.question-container.active, .wash-panel-question.active, .drag-drop-question.active').removeClass('active');
    
            // Update current question
            currentEmbeddedQuestion = index;
    
            // Show new question
            $form.find('.question-container, .wash-panel-question, .drag-drop-question').eq(currentEmbeddedQuestion).addClass('active');
    
            // Update UI
            updateEmbeddedNavigation($form, currentEmbeddedQuestion, totalEmbeddedQuestions);
            $form.find('.current-quiz-question').text(currentEmbeddedQuestion + 1);
        }
    
        function validateEmbeddedQuestion($form, index) {
            const $currentQuestion = $form.find('.question-container, .wash-panel-question, .drag-drop-question').eq(index);
    
            if ($currentQuestion.hasClass('wash-panel-question')) {
                const idx = $currentQuestion.data('index');  // Use data-index from HTML
                const selectedCycle = $(`input[name="selected-cycle-${idx}"]`).val();
                const selectedSpin = $(`input[name="selected-spin-${idx}"]`).val();
                const selectedTemp = $(`input[name="selected-temp-${idx}"]`).val();
    
                console.log(`Validating wash panel question ${idx}: Cycle=${selectedCycle}, Spin=${selectedSpin}, Temp=${selectedTemp}`);
    
                if (!selectedCycle || !selectedSpin || !selectedTemp) {
                    $currentQuestion.find('.feedback').text('Please select one option for each setting.').css('color', 'red').show();
                    return false;
                } else {
                    $currentQuestion.find('.feedback').hide();
                    return true;
                }
            } else if ($currentQuestion.hasClass('drag-drop-question')) {
                // Add validation if needed
                return true;
            } else {
                // Normal multiple-choice
                const isAnswered = $currentQuestion.find('input[type="radio"]:checked').length > 0;
                $currentQuestion.find('.validation-message').toggle(!isAnswered);
                return isAnswered;
            }
        }
    
        // Helper function to update navigation in embedded quiz
        function updateEmbeddedNavigation($form, current, total) {
            // Previous button state
            $form.find('.quiz-prev-btn').prop('disabled', current === 0);
    
            // Next/Submit buttons visibility
            const isLastQuestion = current === total - 1;
            $form.find('.quiz-next-btn').toggle(!isLastQuestion);
            $form.find('.quiz-submit-btn').toggle(isLastQuestion);
        }
    });

    function goToNextQuestion() {
        if (validateCurrentQuestion()) {
            navigateToQuestion(currentQuestion + 1);
        }
    }

    function goToPreviousQuestion() {
        navigateToQuestion(currentQuestion - 1);
    }

    function navigateToQuestion(index) {
        // Validate index range
        if (index < 0 || index >= totalQuestions) return;

        // Hide current question
        $(`#question-${currentQuestion}`).removeClass('active');

        // Update current question
        currentQuestion = index;

        // Show new question with animation
        $(`#question-${currentQuestion}`).addClass('active');

        // Update UI
        updateNavigation();
        updateProgress();

        // Smooth scroll to question
        $('html, body').animate({
            scrollTop: $(`#question-${currentQuestion}`).offset().top - 100
        }, 300);
    }

    function validateCurrentQuestion() {
        const isAnswered = $(`#question-${currentQuestion} input[type="radio"]:checked`).length > 0;
        $(`#question-${currentQuestion} .validation-message`).toggle(!isAnswered);
        return isAnswered;
    }

    function updateNavigation() {
        // Previous button state
        $('#prev-btn').prop('disabled', currentQuestion === 0);

        // Next/Submit buttons visibility
        const isLastQuestion = currentQuestion === totalQuestions - 1;
        $('#next-btn').toggle(!isLastQuestion);
        $('#submit-btn').toggle(isLastQuestion);
    }

    function updateProgress() {
        $('#current-question').text(currentQuestion + 1);
    }

    // Animate progress circle on results page
    const $progressCircle = $('.progress-circle');
    if ($progressCircle.length) {
        const percentage = $progressCircle.data('percentage');
        $progressCircle.css('--percentage', percentage);
    }

    // Add interactivity to quiz options
    $('.option').on('click', function() {
        // Remove active class from all options in this question
        const $questionCard = $(this).closest('.question-card');
        $questionCard.find('.option').removeClass('active');

        // Add active class to selected option
        $(this).addClass('active');

        // Check the radio input
        $(this).find('input[type="radio"]').prop('checked', true);
    });

    // Add animation delays for question cards
    $('.question-card, .question-review').each(function(index) {
        $(this).css('animation-delay', index * 0.1 + 's');
    });

    // Slide navigation for lesson pages
    let currentSlide = 0;
    const totalSlides = $(".slide").length;

    function getSlides() {
        return document.querySelectorAll(".slide");
    }

    function showSlide(index, shouldTrackProgress = false) {
        const slides = getSlides();
        $(".slide").removeClass("active");
        $("#slide" + (index + 1)).addClass("active");
    
        $(".dot").removeClass("active");
        $('.dot[data-slide="' + (index + 1) + '"]').addClass("active");
    
        $("#prev-btn").prop("disabled", index === 0);
        $("#next-btn").prop("disabled", index === totalSlides - 1);
    
        currentSlide = index;
    
        if (!shouldTrackProgress) return;
    
        const slidesArray = Array.from(slides);
        const slideEl = slidesArray[index];
        const slideId = slideEl.getAttribute("data-slide-id");
    
        // Send progress for current slide to log time on the *previous* slide
        $.ajax({
            url: '/save-progress',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: slideId }),
            success: function(res) {
                console.log('Progress saved:', res);
            
                const prevIndex = index - 1;
                const prevItem = document.querySelector(`#sidebar-item-${prevIndex}`);
                if (!prevItem) return;
            
                const statusEl = prevItem.querySelector('.sidebar-status');
                if (!statusEl) return;
            
                const elapsedSeconds = Math.round(res.timeSpent || 0);
                let timeStr;
            
                if (elapsedSeconds < 60) {
                    timeStr = `${elapsedSeconds}s`;
                } else if (elapsedSeconds < 3600) {
                    timeStr = `${Math.floor(elapsedSeconds / 60)}m`;
                } else {
                    timeStr = `${Math.floor(elapsedSeconds / 3600)}h`;
                }
            
                // statusEl.innerHTML = `<div class="d-flex align-items-center"><span class="time">${timeStr}</span></div>`;
                statusEl.style.display = 'inline';
                statusEl.style.color = 'green';
                const sidebarItem = statusEl.closest('li');
                sidebarItem.style.backgroundColor = '#e6ffe6'; 
                // sidebarItem.style.borderRadius = '6px';

            },
            error: function(err) {
                console.error('Progress save failed:', err);
            }
        });
    }
    

    // Navigation handlers
    $("#next-btn").on('click', function() {
        if (currentSlide < totalSlides - 1) {
            showSlide(currentSlide + 1, true);
        }
    });

    $("#prev-btn").on('click', function() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1,true);
        }
    });

    $(".dot").on('click', function() {
        const target = $(this).data("slide") - 1;
        showSlide(target, true);
    });

    // Initialize first slide
    if (totalSlides > 0) {
        showSlide(0, true);
    }

    $('.quiz-option').on('click', function() {
        $(this).siblings('.quiz-option').removeClass('correct incorrect');

        if ($(this).data('correct') === 'true') {
            $(this).addClass('correct');
            $(this).closest('.quiz-container').find('.feedback')
                .text("Correct!")
                .removeClass('incorrect').addClass('correct').show();
        } else {
            $(this).addClass('incorrect');
            $(this).closest('.quiz-container').find('.quiz-option[data-correct="true"]').addClass('correct');
            $(this).closest('.quiz-container').find('.feedback')
                .text("Incorrect. Try again!")
                .removeClass('correct').addClass('incorrect').show();
        }
    });
});

function checkDragAndDropFlexibleGrouping(questionContainer) {
    let bins = $(questionContainer).find('.bin');
    let allGroups = new Set();
    let usedGroups = new Set();
    let allCorrect = true;

    bins.each(function() {
        let groupsInBin = new Set();
        $(this).find('.drag-item').each(function() {
            const group = $(this).data('group');
            console.log("Group in bin: ", group);
            groupsInBin.add(group);
            allGroups.add(group);
        });

        if (groupsInBin.size === 0) {
            // Empty bin, ignore
            return;
        }

        if (groupsInBin.size > 1) {
            allCorrect = false;
            $(this).addClass('incorrect-bin');
        } else {
            const group = Array.from(groupsInBin)[0];
            if (usedGroups.has(group)) {
                // Same group appears in multiple bins, error
                allCorrect = false;
                $(this).addClass('incorrect-bin');
            } else {
                usedGroups.add(group);
                $(this).addClass('correct-bin');
            }
        }
    });

    // Final sanity check: Did we account for all groups?
    if (allGroups.size !== usedGroups.size) {
        allCorrect = false;
    }

    const feedback = $(questionContainer).find('.feedback');
    if (allCorrect) {
        feedback.text("Perfect grouping!").removeClass('incorrect').addClass('correct').show();
    } else {
        feedback.text("Incorrect grouping. Try again!").removeClass('correct').addClass('incorrect').show();
    }
}

$(document).on('click', '.check-drag-btn', function() {
    const questionContainer = $(this).closest('.drag-drop-question');
    checkDragAndDropFlexibleGrouping(questionContainer);
});

$(document).ready(function () { 
    let draggedItem = null;

    $(document).on('dragstart', '.drag-item', function (e) {
        draggedItem = $(this);
        setTimeout(() => {
            $(this).addClass('dragging');
        }, 0);
    });

    $(document).on('dragend', '.drag-item', function (e) {
        $(this).removeClass('dragging');
    });

    $(document).on('dragover', '.bin', function (e) {
        e.preventDefault();
    });

    $(document).on('drop', '.bin', function (e) {
        e.preventDefault();
        if (draggedItem) {
            $(this).append(draggedItem);
            const binName = $(this).data('bin');
            const itemId = draggedItem.attr('id');
            // Save the drop result
            $(`#drag-result-${itemId}`).val(binName);
        }
    });


  //ADDED FOR WASH PANEL
    $(document).on('click', '.wash-option', function () {
    let type = $(this).data('type'); // "cycle", "spin", or "temp"
    let parent = $(this).parent();   // the div with wash-options
    //let index = parent.attr('id').split('-').pop(); // grabs the index from the ID
    let container = $(this).closest('.wash-panel-question');
    let index = container.data('index');

    parent.find('.wash-option').removeClass('active');
    $(this).addClass('active');

    let value = $(this).data('value');
    $(`input[name="selected-${type}-${index}"]`).val(value); // This is the key!

    // tracking

      $(".sidebar-status").hide();

      showSlide(0, false);
  
      $("#next-btn").click(() => {
          const nextIndex = currentSlide + 1;
          if (nextIndex < totalSlides) {
              $(".sidebar-status").eq(nextIndex).show();
              showSlide(nextIndex, true);
          }
      });
  
      $("#prev-btn").click(() => {
          const prevIndex = currentSlide - 1;
          if (prevIndex >= 0) {
              showSlide(prevIndex, false);
          }
      });
  
      $("#sidebar-tracker li").each(function (index) {
          $(this).click(() => {
              $(".sidebar-status").eq(index).show();
              showSlide(index, true);
          });
      });
 });
    

    // When Check Answer button is clicked

    $(document).on('click', '.check-wash-btn', function () {
        let container = $(this).closest('.wash-panel-question');
        
        const index = container.data('index');  // Get the index
        const selectedCycle = $(`input[name="selected-cycle-${index}"]`).val();
        const selectedSpin = $(`input[name="selected-spin-${index}"]`).val()
        const selectedTemp = $(`input[name="selected-temp-${index}"]`).val();
        let feedback = container.find('.feedback');
    
        if (!selectedCycle || !selectedSpin || !selectedTemp) {
            feedback.text("Please select one option for each category.").css('color', 'red').show();
            return;
        }
    
        let correctAnswer;
        try {
            correctAnswer = container.data('answer'); // Use .data() to parse JSON automatically
        } catch (e) {
            feedback.text("Missing or invalid answer key.").css('color', 'red').show();
            return;
        }
    
        const match = (selected, correct) =>
            Array.isArray(correct) ? correct.includes(selected) : selected === correct;
    
        if (
            match(selectedCycle, correctAnswer.cycle) &&
            match(selectedSpin, correctAnswer.spin) &&
            match(selectedTemp, correctAnswer.temperature)
        ) {
            feedback.text("Correct! ✅").css('color', 'green').show();
        } else {
            feedback.text("Incorrect. Try again! ❌").css('color', 'red').show();
        }
    });

    
    
    
});    
