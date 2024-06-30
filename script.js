function startSlash() {
    const samurai = document.querySelector('.samurai');
    const button = document.querySelector('.slash-button');
    const buttonLeft = document.querySelector('.button-left');
    const buttonRight = document.querySelector('.button-right');

    button.style.display = 'none';
    samurai.style.opacity = '1';

    setTimeout(() => {
        buttonLeft.style.display = 'block';
        buttonRight.style.display = 'block';
        document.querySelector('.samurai-container').classList.add('split');
    }, 1000);
}
