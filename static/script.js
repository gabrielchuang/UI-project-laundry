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
function createSlide(slide, index) {
    const activeClass = index === 0 ? 'active' : '';
    let imageHtml = '';

    // Handle images
    if (slide.images && slide.images.length > 0) {
        const img = slide.images[0];
        if (typeof img === 'string') {
            imageHtml = `
            <div class="col-md-6 text-center">
              <img src="{{ url_for('static', filename='imgs/') }}${img}"
                   alt="${slide.title}"
                   class="rounded sorting--bg-image">
            </div>`;
        } else {
            imageHtml = `
            <div class="col-md-6 text-center">
              <img src="{{ url_for('static', filename='') }}${img.src}"
                   alt="${img.alt || slide.title}"
                   class="rounded sorting--bg-image">
            </div>`;
        }
    }

    // Handle quiz type
    if (slide.type === "quiz") {
        const options = slide.options.map(opt =>
            `<div class="quiz-option" data-correct="${opt.correct}">${opt.text}</div>`
        ).join('');

        return `
          <div class="slide ${activeClass}" id="slide${index + 1}">
            <div class="row align-items-center my-4">
              <div class="col-md-6">
                <h2>${slide.title}</h2>
                <p>${slide.description}</p>
                <div class="quiz-options mt-3">${options}</div>
                <div class="feedback mt-3"></div>
              </div>
              ${imageHtml}
            </div>
          </div>`;
    }

    // Handle menu type (with children buttons)
    if (slide.type === "menu" && slide.children) {
        const buttons = slide.children.map(child => `
          <div class="col-md-4 mb-3">
            <button class="btn sort-btn w-100"
                onclick="location.href='{{ url_for('dynamic_lesson', lesson_id=child.id) }}'">
                    {{ child.title }}
                </button>
          </div>
        `).join('');

        return `
          <div class="slide ${activeClass}" id="slide${index + 1}">
            <div class="row align-items-center my-4">
              <div class="col-md-6">
                <h2>${slide.title}</h2>
                <p>${slide.description}</p>
              </div>
              ${imageHtml}
            </div>
            <div class="row g-3 my-4">
              ${buttons}
            </div>
          </div>`;
    }

    // Default content type
    return `
        <div class="slide ${activeClass}" id="slide${index + 1}">
          <div class="row align-items-center my-4">
            <div class="col-md-6">
              <h2>${slide.title}</h2>
              <p>${slide.description}</p>
            </div>
            ${imageHtml}
          </div>
        </div>`;
}

$(document).ready(function () {
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