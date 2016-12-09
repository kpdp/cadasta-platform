/* eslint-env jquery */

function enableGroup() {
  $('.party-gr').removeClass('hidden');
  $('.party-in').addClass('hidden');
  $('.party-co').addClass('hidden');
  $('.party-gr .form-control').prop('disabled', '');
  $('.party-in .form-control').prop('disabled', 'disabled');
  $('.party-co .form-control').prop('disabled', 'disabled');
}

function enableIndividual() {
  $('.party-in').removeClass('hidden');
  $('.party-gr').addClass('hidden');
  $('.party-co').addClass('hidden');
  $('.party-in .form-control').prop('disabled', '');
  $('.party-gr .form-control').prop('disabled', 'disabled');
  $('.party-co .form-control').prop('disabled', 'disabled');
}

function enableCorporation() {
  $('.party-co').removeClass('hidden');
  $('.party-gr').addClass('hidden');
  $('.party-in').addClass('hidden');
  $('.party-co .form-control').prop('disabled', '');
  $('.party-gr .form-control').prop('disabled', 'disabled');
  $('.party-in .form-control').prop('disabled', 'disabled');
}

function disableConditionals() {
  $('.party-co').addClass('hidden');
  $('.party-gr').addClass('hidden');
  $('.party-in').addClass('hidden');
  $('.party-co .form-control').prop('disabled', 'disabled');
  $('.party-gr .form-control').prop('disabled', 'disabled');
  $('.party-in .form-control').prop('disabled', 'disabled');
}

function toggleParsleyRequired(val) {
  const typeChoices = ['in', 'gr', 'co'];
  $.each(typeChoices, function(idx, choice) {
    if (val === choice) {
      $.each($(`.party-${val} .form-control`), function(idx, value) {
        if (value.hasAttribute('data-parsley-required')) {
          $(value).attr('data-parsley-required', true);
          $(value).prop('required', 'required');
        }
      });
    } else {
      $.each($(`.party-${choice} .form-control`), function(idx, value) {
        if (value.hasAttribute('data-parsley-required')) {
          $(value).attr('data-parsley-required', false);
          $(value).prop('required', '');
        }
      });
    }
  });
}

function toggleStates(val) {
  if (val === 'in') {
    enableIndividual();
    toggleParsleyRequired(val);
  }
  if (val === 'gr') {
    enableGroup();
    toggleParsleyRequired(val);
  }
  if (val === 'co') {
    enableCorporation();
    toggleParsleyRequired(val);
  }
  if (val === '') {
    disableConditionals();
  }
}

$().ready(function() {
  const val = $('.party-type').val().toLowerCase();
  toggleStates(val);
});


$('select.party-type').on('change', function(e) {
  const val = e.target.value.toLowerCase();
  toggleStates(val);
});
