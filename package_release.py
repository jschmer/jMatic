# package all files needed for a standalone release version,
# zip them up and put them into the build directory.
import os, zipfile, shutil
from compile_templates import compile_jMatic

package_entities = [
  'css',
  'img',
  'js',
  'lib/xml2json/xml2json.min.js',
  'lib/jQuery/jquery-2.1.3.min.js',
  'lib/angular/core/angular.min.js',
  #'lib/angular/core/angular.min.js.map',
  'lib/angular/modules/route/angular-route.min.js',
  #'lib/angular/modules/route/angular-route.min.js.map',
  'lib/angular/modules/animate/angular-animate.min.js',
  #'lib/angular/modules/animate/angular-animate.min.js.map',
  'lib/angular/modules/toasty/css/ng-toasty.css',
  'lib/angular/modules/toasty/js/ng-toasty.min.js',
  'lib/angular/modules/translate/angular-translate.min.js',
  'lib/angular/mobile-ui/css/mobile-angular-ui-hover.min.css',
  'lib/angular/mobile-ui/css/mobile-angular-ui-base.min.css',
  'lib/angular/mobile-ui/css/mobile-angular-ui-desktop.min.css',
  'lib/angular/mobile-ui/js/mobile-angular-ui.min.js',
  'lib/angular/mobile-ui/fonts',
  'index.html'
]

def zipdir(path, zip):
    for root, dirs, files in os.walk(path):
        for file in files:
            zip.write(os.path.join(root, file))

def package_jMatic():
    # clean build dir
    build_dir = './build/'
    shutil.rmtree(build_dir, True)
    os.makedirs(build_dir)
    
    zipped_release = build_dir + 'jMatic.zip'
    with zipfile.ZipFile(zipped_release, 'w') as zipf:
      for entity in package_entities:
        if os.path.isfile(entity):
          zipf.write(entity)
        elif os.path.isdir(entity):
          zipdir(entity, zipf)
      zipf.close()
    
    # also extract to build dir
    with zipfile.ZipFile(zipped_release, 'r') as zipf:
      zipf.extractall(build_dir + 'jMatic')

if __name__=='__main__':
  compile_jMatic()
  package_jMatic()