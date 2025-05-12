$(document).ready(function () {
    // Animate progress circle on results page
    const $progressCircle = $('.progress-circle');
    if ($progressCircle.length) {
        const percentage = $progressCircle.data('percentage');
        $progressCircle.css('--percentage', percentage);
    }

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
    

        const type = slides[index].getAttribute('data-slide-type');
        const isQuiz = type === "quiz";
        console.log("isQuiz: ", isQuiz);
     

        $("#prev-btn").prop("disabled", index === 0);
        $("#next-btn").prop("disabled", index === totalSlides - 1 || isQuiz);
    
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

    const btn = document.getElementById("reset-progress-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        if (confirm("Are you sure you want to reset your progress?")) {
          fetch("/reset-progress", { method: "POST" })
            .then(res => res.json())
            .then(data => {
              alert(data.message);
              window.location.href = "/page/mainpage1";  // ✅ redirect here
            })
            .catch(err => {
              alert("Error resetting progress");
              console.error(err);
            });
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
            $('#next-btn').prop('disabled', false);  // ✅ enable next
        } else {
            feedback.text("Incorrect. Try again! ❌").css('color', 'red').show();
            $('#next-btn').prop('disabled', true);   // 🔒 stay locked
        }
    });

    document.querySelectorAll('.question-container-mcq').forEach(container => {
        const form = container.querySelector('.question-card');
        const submitBtn = form.querySelector('.btn.btn-primary');
        const optionsContainer = form.querySelector('.options-container');
        const feedbackEl = form.querySelector('.feedback-message');
        const validationMsg = form.querySelector('.validation-message');
    
        submitBtn.addEventListener('click', function (e) {
          e.preventDefault();
    
          const selected = optionsContainer.querySelector('input[type="radio"]:checked');
          const correctAnswer = optionsContainer.dataset.answer;
    
          if (!selected) {
            validationMsg.style.display = 'block';
            feedbackEl.textContent = '';
            return;
          }
    
          validationMsg.style.display = 'none';
          const userAnswer = selected.value;
    
          if (userAnswer === correctAnswer) {
            feedbackEl.textContent = '✅ Correct!';
            feedbackEl.style.color = 'green';
            $('#next-btn').prop('disabled', false);  // ✅ enable next
          } else {
            feedbackEl.textContent = `❌ Incorrect. Try again!`;
            feedbackEl.style.color = 'red';
            $('#next-btn').prop('disabled', true);   // 🔒 stay locked
          }
        });
      });
});

function checkDragAndDropFlexibleGrouping(questionContainer) {
    console.log("Checking drag and drop flexible grouping...");
    let bins = $(questionContainer).find('.bin');
    let allGroups = new Set();
    let usedGroups = new Set();
    let allCorrect = true;

    let feedback_text = "";

    let num_items_unsorted = 0;
    num_items_unsorted = $(questionContainer).find('.drag-items .drag-item').length;
    if (num_items_unsorted !== 0) {
        allCorrect = false;
        feedback_text = "You have not sorted all items. ";
    }

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
            // give more info about which items in this bin can't be washed together 
            first_item = $(this).find('.drag-item').first().data("text")
            console.log($(this).find('.drag-item').first())
            console.log("First item: ", first_item);
            $(this).find('.drag-item').each(function() {
                const group = $(this).data('group');
                if (group != groupsInBin[0]) {
                    console.log("this dot data text is " + $(this).data("text"))
                    feedback_text = "You shouldn't wash a " + $(this).data("text") + " with a " + first_item + "!";
                }
            });
        } else {
            const group = Array.from(groupsInBin)[0];
            if (usedGroups.has(group)) {
                // Same group appears in multiple bins, error
                console.log("Group already used: ", group);
                allCorrect = false;
                $(this).removeClass('correct-bin');
                $(this).addClass('incorrect-bin');
            } else {
                console.log("Group used: ", group);
                usedGroups.add(group);
                $(this).removeClass('incorrect-bin');
                $(this).addClass('correct-bin');
            }
        }
    });

    // Final sanity check: Did we account for all groups?
    if (allGroups.size !== usedGroups.size) {
        allCorrect = false;
        console.log("Not all groups accounted for.");
    }

    const feedback = $(questionContainer).find('.feedback');
    if (allCorrect) {
        feedback.text("Perfect grouping!").removeClass('incorrect').addClass('correct').show();
        $('#next-btn').prop('disabled', false);  // ✅ enable next
    } else {
        feedback.text("Incorrect grouping. " + feedback_text + " Try again!").removeClass('correct').addClass('incorrect').show();
        $('#next-btn').prop('disabled', true);   // 🔒 stay locked
    }
}

$(document).on('click', '.check-drag-btn', function() {
    const questionContainer = $(this).closest('.drag-drop-question');
    checkDragAndDropFlexibleGrouping(questionContainer);
});


document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll(".slide");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const continueBtn = document.getElementById("continue-btn");
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });

        // Update visibility of Previous button
        //prevBtn.style.display = index === 0 ? "none" : "inline-block";

        // Hide Next button and show Continue on last slide
        if (index === slides.length - 1) {
            //nextBtn.style.display = "none";
            continueBtn.style.display = "inline-block";
        } else {
            //nextBtn.style.display = "inline-block";
            continueBtn.style.display = "none";
        }

        currentSlide = index;
    }

    prevBtn.onclick = function () {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    };

    nextBtn.onclick = function () {
        if (currentSlide < slides.length - 1) {
            showSlide(currentSlide + 1);
        }
    };

    // Initialize
    showSlide(0);
});
