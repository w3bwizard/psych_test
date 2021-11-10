const {src, dest}       = require('gulp');
const gulp              = require('gulp');
const browserSync       = require('browser-sync').create();
const fileinclude       = require('gulp-file-include');
const scss              = require('gulp-sass');
const sourcemaps        = require('gulp-sourcemaps');
const autoprefixer      = require('gulp-autoprefixer');
const group_media       = require('gulp-group-css-media-queries');
const cleanCSS          = require('gulp-clean-css');
const rename            = require('gulp-rename');
const shorthand         = require('gulp-shorthand');
const uglify            = require('gulp-uglify-es').default;
const del               = require('del');
const ttf2woff          = require('gulp-ttf2woff');
const ttf2woff2         = require('gulp-ttf2woff2');
const fonter            = require('gulp-fonter');
const fs                = require('fs');
const svgSprite         = require('gulp-svg-sprite');

// Инициализация сервера для автоматического обновления страницы
function browsersync(){
    browserSync.init({
        server: {
            baseDir: './dist/'
        },
        // notify: false
    })
}

//Обработка html
function html(){
    return src(['app/*.html', '!app/_*.html'])
    .pipe(fileinclude())
    .pipe(dest('dist/'))
    .pipe(browserSync.stream())
}

// Обработка SCSS
function css(){
    return src('app/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(scss({outputStyle: 'expanded'}))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/css/'))
    .pipe(browserSync.stream())     
}

//Обработка js
function js(){
    return src('app/js/*.js')
    .pipe(fileinclude())
    .pipe(dest('dist/js/'))
    .pipe(browserSync.stream())
}

//Обработка картинок
function img(){
    return src('app/img/*')
    .pipe(dest('dist/img/'))
}

//Очитска папки с проектом
function clean(){
    return del(['dist/**', '!dist/fonts', '!dist/favicon.ico.gif']);
}


function cb(){

}

//Слежение за файлами
function watchFiles(){
    gulp.watch(['app/*.html'], html)
    gulp.watch(['app/scss/*.scss'], css)
    gulp.watch(['app/js/*.js'], js)
    gulp.watch(['app/img/*'], img)
}


/* Обработка шрифтов (gulp fonts) */
//====================================================
//Очистка папки со шрифтами
function cleanFonts(){
    return del('dist/fonts');
}

//Конвертация otf в ttf
function otf2ttf(){
    return src('app/fonts/*.otf')
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest('app/fonts/'))
}

//Конвертация ttf в веб форматы
function ttf2web(){ 
    src('app/fonts/*')
    .pipe(ttf2woff())
    .pipe(dest('dist/fonts/'));
    return src('app/fonts/*')
    .pipe(ttf2woff2())
    .pipe(dest('dist/fonts/'));    
}
//Запись данных шрифта в переменные в файле _fonts.scss
function fontsStyle(cb){
    return fs.readdir('app/fonts', function (err, items) {
        if (items) {
            fs.readFile('app/scss/_fonts.scss', 'utf8', function(err, contents) {
                if (contents.indexOf('@import \'_mixins\';\r\n') == -1) {
                    fs.appendFile('app/scss/_fonts.scss', '@import \'_mixins\';\r\n', cb);
                }
            });            
            for (var i = 0; i < items.length; i++) {
                let fontname = items[i].split('.');
                fontname = fontname[0];
                fs.readFile('app/scss/_fonts.scss', 'utf8', function(err, contents) {
                    if (contents.indexOf(fontname) == -1) {
                        fs.appendFile('app/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                });
            }
        }
        cb();
    }) 
}
//====================================================

/* Оптимизация CSS */
//====================================================
function css_proc(){
    return src('app/scss/*.scss')
    .pipe(scss({
        outputStyle: 'compact',
        includePaths: []
        }))    
    .pipe(shorthand())
    .pipe(
        autoprefixer({
            overrideBrowserslist: ['last 3 version']
        })
    )
    .pipe(group_media())
    .pipe(cleanCSS({debug: true}, (details) => {
        console.log(`CSS full size: ${details.stats.originalSize}`);
        console.log(`CSS minified size: ${details.stats.minifiedSize}`);
      }))
    .pipe(
        rename({
            extname: '.min.css'
        })
    )
    .pipe(dest('dist/css/'))  
}
//====================================================


/* Создание SVG спрайтов */
//====================================================
function ggsvg(){
    return src('app/ggsvg/*.svg')
    .pipe(svgSprite({
        mode: {
            symbol: {
              sprite: '../sprite.svg',
            },
          },
          shape: {
            transform: [
              {
                svgo: {
                  plugins: [
                    {
                      removeAttrs: {
                        attrs: ['fill'],
                      },
                    },
                  ],
                },
              },
            ],
          },
        }))
    .pipe(gulp.dest('app/ggsvg/sprite'));
}
//====================================================


let fonts = gulp.series(cleanFonts, otf2ttf, ttf2web, fontsStyle)
let build = gulp.series(clean, gulp.parallel(html, css, js, img));
let watch = gulp.parallel(build, watchFiles, browsersync);

exports.watch = watch;
exports.build = build;
exports.default = watch;
exports.css = css;
exports.clean = clean;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.ggsvg = ggsvg;
