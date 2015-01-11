import os, zipfile
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
    zipf = zipfile.ZipFile('jMatic.zip', 'w')
    for entity in package_entities:
      if os.path.isfile(entity):
        zipf.write(entity)
      elif os.path.isdir(entity):
        zipdir(entity, zipf)
    zipf.close()

if __name__=='__main__':
  compile_jMatic()
  package_jMatic()