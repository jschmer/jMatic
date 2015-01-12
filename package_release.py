# package all files needed for a standalone release version,
# zip them up and put them into the build directory.
import os, zipfile, shutil
from compile_templates import compile_jMatic

package_entities = [
  'css',
  'img',
  'js',
  'lib',
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