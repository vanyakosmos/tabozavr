import {Background, Options, Theme, Visibility} from "./types";
import {Logger} from "./utils";


const logger = new Logger('options');

export function setUpOptions(options: Options) {
    setActions(options);
    setUpTheme(options.theme)
}

function fadeInOut($target: JQuery, html, duration = 1000) {
    $target
        .html(html)
        .addClass('uk-animation-slide-top-small')
        .removeClass('uk-animation-slide-bottom-small uk-animation-reverse');
    setTimeout(function () {
        $target
            .remove('uk-animation-slide-top-small')
            .addClass('uk-animation-slide-bottom-small uk-animation-reverse');

    }, duration)
}

function setActions(options) {
    logger.log('setting save and set default buttons...');
    const $actionsInfo = $('#actions-info');

    $('#save-settings').click(function () {
        if (options.theme.background.def != 'image')
            options.theme.background.image = '';
        chrome.storage.local.set({'options': options}, function () {
            logger.log('saved');
            fadeInOut($actionsInfo, 'saved', 1500)
        })
    });

    $('#set-default-modal').find('button[name="ok"]').click(function () {
        chrome.storage.local.clear(function () {
            logger.log('cleared storage');
            // todo: apply default options w/o reloading (but need to exclude from reloading event listeners appliers)
            chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.reload(tab.id);
            });
        });
    });
}

function setUpTheme(theme: Theme) {
    logger.log('setting visibility and background..');
    visibility(theme.visibility);
    background(theme.background)
}

function background(options: Background) {
    const $body = $('body');
    const $inputs = $('input[name=background]');

    const $colorInput = $('#bg-color-input');
    const $imageInput = $('#bg-image-input');


    $inputs.each(function () {
        const self = $(this);
        console.log(self.val());
        if (self.val() == options.def) {
            self.prop('checked', true);
        }
        if (self.val() == 'color') {
            $('#bg-color-input').val(options.color)
        }
    });

    function setColor(color) {
        $body
            .css('background-color', color)
            .css('background-image', 'none');
    }

    function setImage(image) {
        $body
            .css('background-color', '')
            .css('background-image', `url("${image}")`);
    }

    if (options.def == 'image' && options.image != '') {
        setImage(options.image)
    }
    else {
        setColor(options.color)
    }

    $inputs.change(function () {
        const self = $(this);
        if (self.prop('checked')) {
            console.log('changed default:', self.val());
            options.def = self.val() as string;

            if (self.val() == 'image' && options.image != '') {
                setImage($imageInput.val())
            }
            else {
                setColor($colorInput.val())
            }
        }
    });


    $colorInput.change(function () {
        let color = $(this).val() as string;
        $body
            .css('background-color', color)
            .css('background-image', 'none');
        options.color = color;
        options.def = 'color';
    });

    $imageInput.change(function () {
        const file = $(this).prop("files")[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            let imageUrl = reader.result;
            // console.log(imageUrl);
            $body
                .css('background-color', '')
                .css('background-image', `url("${imageUrl}")`);
            options.image = imageUrl;
            options.def = 'image';
        };
        if (file)
            reader.readAsDataURL(file);
    });
}

function visibility(options: Visibility) {
    const $block = $('#opt-visibility');
    const $opacity = $block.find('div').eq(0);
    const $hover = $block.find('div').eq(1);
    const $opacityInput = $opacity.find('input');
    const $hoverInput = $hover.find('input');

    $opacityInput.on('change mousemove', function () {
        const val = $(this).val() as number;
        $opacity.find('span').html(`Opacity: ${val}%`);
        $('.hidable').css('opacity', val / 100);
        options.opacity = val;
    });

    $hoverInput.on('change', function () {
        options.revealOnHover = $(this).prop('checked');
    });

    $('.hidable').hover(function () {
        if ($hoverInput.is(':checked')) {
            $(this).addClass('visible');
        }
        else {
            $(this).removeClass('visible');
        }
    }, function () {
        $(this).removeClass('visible');
    });

    $opacityInput.val(options.opacity).trigger('change');
    $hoverInput.prop('checked', options.revealOnHover);
}