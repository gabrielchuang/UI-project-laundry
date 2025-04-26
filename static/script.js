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
                incorrectQuestions.push({index, selectedOption, selectedLabel});
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
        incorrectQuestions.forEach(({index, selectedOption, selectedLabel}) => {
            if (confirm(`Incorrect answer for question ${index + 1}. Would you like to try again?`)) {
                selectedOption.checked = false;
                selectedLabel.style.color = 'black';
                selectedLabel.style.backgroundColor = 'transparent';
            }
        });
    }
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
    // Create slides
    const slidesHtml = slidesData.map((slide, index) => createSlide(slide, index)).join('');
    $('#slides-container').html(slidesHtml);

    // Create progress dots
    const dotsHtml = slidesData.map((_, i) =>
        `<span class="dot${i === 0 ? ' active' : ''}" data-slide="${i + 1}"></span>`
    ).join('');
    $('#progress-dots').html(dotsHtml);

    // Initialize navigation
    let currentSlide = 0;
    const totalSlides = slidesData.length;

    function showSlide(index) {
        $('.slide').removeClass('active');
        $(`#slide${index + 1}`).addClass('active');

        $('.dot').removeClass('active');
        $(`.dot[data-slide="${index + 1}"]`).addClass('active');

        $('#prev-btn').prop('disabled', index === 0);
        $('#next-btn').prop('disabled', index === totalSlides - 1);

        currentSlide = index;
    }

    // Navigation handlers
    $('#next-btn').click(() => currentSlide < totalSlides - 1 && showSlide(currentSlide + 1));
    $('#prev-btn').click(() => currentSlide > 0 && showSlide(currentSlide - 1));
    $('.dot').click(function () {
        showSlide($(this).index());
    });

    // Quiz functionality
    $(document).on('click', '.quiz-option', function () {
        $('.quiz-option').removeClass('correct incorrect');

        if ($(this).attr('data-correct') === 'true') {
            $(this).addClass('correct');
            $(this).closest('.slide').find('.feedback')
                .text("Correct!")
                .removeClass('incorrect').addClass('correct').show();
        } else {
            $(this).addClass('incorrect');
            $(this).closest('.slide').find('.quiz-option[data-correct="true"]').addClass('correct');
            $(this).closest('.slide').find('.feedback')
                .text("Incorrect. Try again!")
                .removeClass('correct').addClass('incorrect').show();
        }
    });
});