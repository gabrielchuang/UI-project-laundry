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

    // Handle embedded quizzes in lesson pages
    $('.embedded-quiz-form').each(function() {
        const $form = $(this);
        const $questions = $form.find('.question-container');
        const totalEmbeddedQuestions = $questions.length;
        let currentEmbeddedQuestion = 0;

        // Set up navigation handlers for this embedded quiz
        $form.find('.quiz-next-btn').click(function() {
            if (validateEmbeddedQuestion($form, currentEmbeddedQuestion)) {
                navigateEmbeddedQuestion($form, currentEmbeddedQuestion + 1);
            }
        });

        $form.find('.quiz-prev-btn').click(function() {
            navigateEmbeddedQuestion($form, currentEmbeddedQuestion - 1);
        });

        // Initialize navigation state
        updateEmbeddedNavigation($form, currentEmbeddedQuestion, totalEmbeddedQuestions);

        // Helper function to navigate between questions in embedded quiz
        function navigateEmbeddedQuestion($form, index) {
            // Validate index range
            if (index < 0 || index >= totalEmbeddedQuestions) return;

            // Hide current question
            $form.find('.question-container.active').removeClass('active');

            // Update current question
            currentEmbeddedQuestion = index;

            // Show new question
            $form.find('.question-container').eq(currentEmbeddedQuestion).addClass('active');

            // Update UI
            updateEmbeddedNavigation($form, currentEmbeddedQuestion, totalEmbeddedQuestions);
            $form.find('.current-quiz-question').text(currentEmbeddedQuestion + 1);
        }

        // Helper function to validate current question in embedded quiz
        function validateEmbeddedQuestion($form, index) {
            const $currentQuestion = $form.find('.question-container').eq(index);
            const isAnswered = $currentQuestion.find('input[type="radio"]:checked').length > 0;
            $currentQuestion.find('.validation-message').toggle(!isAnswered);
            return isAnswered;
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

    function showSlide(index) {
        $(".slide").removeClass("active");
        $("#slide" + (index + 1)).addClass("active");

        $(".dot").removeClass("active");
        $('.dot[data-slide="' + (index + 1) + '"]').addClass("active");

        $("#prev-btn").prop("disabled", index === 0);
        $("#next-btn").prop("disabled", index === totalSlides - 1);

        currentSlide = index;
    }

    // Navigation handlers
    $("#next-btn").on('click', function() {
        if (currentSlide < totalSlides - 1) {
            showSlide(currentSlide + 1);
        }
    });

    $("#prev-btn").on('click', function() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    });

    $(".dot").on('click', function() {
        const target = $(this).data("slide") - 1;
        showSlide(target);
    });

    // Initialize first slide
    if (totalSlides > 0) {
        showSlide(0);
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