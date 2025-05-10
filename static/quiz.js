$(function(){
    // — Question navigation & validation —
    const $qs   = $('[id^="question-"]');
    const total = $qs.length;
    let current = 0;
  
    function showQuestion(i){
      $qs.removeClass('active');
      $qs.eq(i).addClass('active');
      current = i;
      updateControls();
      $('html, body').animate({
        scrollTop: $qs.eq(i).offset().top - 80
      }, 200);
    }
  
    function updateControls(){
      $('#prev-btn').prop('disabled', current === 0);
      $('#next-btn').toggle(current < total - 1);
      $('#submit-btn').toggle(current === total - 1);
      $('#current-question').text(current + 1);
    }
  
    function validateCurrent(){
      const $q = $qs.eq(current);
      const type = $q.data('type');
  
      // 1) Drag-and-drop must assign all hidden inputs
      if(type === 'drag_and_drop'){
        let allDone = true;
        $q.find('input[name^="drag_result_"]').each(function(){
          if(!$(this).val()) allDone = false;
        });
        if(!allDone){
          $q.css('border','2px solid red')
            .find('.quiz-feedback')
            .text('Please drag every item into a bin.')
            .show();
        } else {
          $q.css('border','none').find('.quiz-feedback').hide();
        }
        return allDone;
      }
  
      // 2) All other types: radio OR wash-panel hidden inputs (they are required) OR select
      const answered = $q.find('input[type=radio]:checked, input[type=hidden][required], select[required]')
                        .filter(function(){
                          if(this.type==='hidden') return $(this).val() !== '';
                          return true;
                        }).length > 0;
      if(!answered){
        $q.css('border','2px solid red');
      } else {
        $q.css('border','none');
      }
      return answered;
    }
  
    $('#next-btn').click(function(){
      if(validateCurrent()) showQuestion(current + 1);
    });
    $('#prev-btn').click(function(){
      showQuestion(current - 1);
    });
    //$('#quiz-form').on('submit', function(e){
    //  if(!validateCurrent()){
    //    e.preventDefault();
    //  }
    //});
  
    if(total) showQuestion(0);
  
    // — Drag & Drop wiring —
    let draggedId = null;
    $(document)
      .on('dragstart', '.quiz-drag-item', function(){
        draggedId = $(this).data('item-id');
        $(this).addClass('dragging');
      })
      .on('dragend', '.quiz-drag-item', function(){
        $(this).removeClass('dragging');
      })
      .on('dragover', '.quiz-bin', function(e){
        e.preventDefault();
      })
      .on('drop', '.quiz-bin', function(e){
        e.preventDefault();
        if(!draggedId) return;
        const $item = $(`.quiz-drag-item[data-item-id="${draggedId}"]`);
        const bin   = $(this).data('bin');
        $(this).append($item);
        $(`#drag_result_${draggedId}`).val(bin);
        draggedId = null;
      });
  
    // — Wash-panel card clicks —
    $(document).on('click', '.wash-card', function(){
      const $c    = $(this);
      const type  = $c.data('type');
      const idx   = $c.data('index');
      // deselect siblings
      $(`.wash-card[data-type="${type}"][data-index="${idx}"]`)
        .removeClass('active border-primary')
        .addClass('border-secondary');
      // select this one
      $c.addClass('active border-primary').removeClass('border-secondary');
      // update hidden input
      $(`#selected-${type}-${idx}`).val($c.data('value')).trigger('change');
    });
  
    // — Check Answer for drag-and-drop grouping —
    $(document).on('click', '.quiz-check-drag-btn', function(){
      const $wrap = $(this).closest('.quiz-drag-drop');
      let allCorrect = true;
      const used = new Set(), seen = new Set();
  
      $wrap.find('.quiz-bin').each(function(){
        const grp = new Set();
        $(this).find('.quiz-drag-item').each(function(){
          const g = $(this).data('group');
          grp.add(g);
          seen.add(g);
        });
        if(grp.size !== 1 || used.has([...grp][0])){
          allCorrect = false;
        }
        grp.forEach(g=> used.add(g));
      });
      if(seen.size !== used.size) allCorrect = false;
  
      const $fb = $wrap.find('.quiz-feedback');
      if(allCorrect){
        $wrap.find('.quiz-bin')
             .addClass('border-success')
             .removeClass('border-danger');
        $fb.text('Perfect grouping! ✅')
           .removeClass('text-danger')
           .addClass('text-success')
           .show();
        $('#next-btn').prop('disabled', false);
      } else {
        $wrap.find('.quiz-bin')
             .addClass('border-danger')
             .removeClass('border-success');
        $fb.text('Incorrect grouping. Try again! ❌')
           .removeClass('text-success')
           .addClass('text-danger')
           .show();
        $('#next-btn').prop('disabled', true);
      }
    });
  });