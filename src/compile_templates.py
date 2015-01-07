import os, sys, re

def regex_walk(regex, top='.'):
  matches = []
  matcher = re.compile(regex);
  print(matcher.pattern)
  for dirpath, dirnames, filenames in os.walk(top):
    full_relative_filepaths = [os.path.join(dirpath, name) for name in filenames]
    for filepath in full_relative_filepaths:
      if matcher.match(filepath):
        matches.append(filepath)
  return matches

def compile_template(template_name, template_content, module_name='templates'):
  print("Compiling {}".format(template_name))
  
  template_content_lines = template_content.splitlines()

  template_content_lines = [x.replace(r"'", r"\'") for x in template_content_lines]
  javascript_template_content = [r"'{}\n'".format(x) for x in template_content_lines[:-1]]
  javascript_template_content.append(r"'{}'".format(template_content_lines[-1]));

  javascript_template_content_string = " +\n      ".join(javascript_template_content)

  return r"""
(function(module) {{
  try {{
    module = angular.module('{0}');
  }} catch (e) {{
    module = angular.module('{0}', []);
  }}
  module.run(function($templateCache) {{
    $templateCache.put('{1}',
      {2});
  }});
}})();
""".format(module_name, template_name, javascript_template_content_string)

if __name__=='__main__':
  templates = r'partials\\.+\.html'
  stripPrefix = r'partials\\'
  outputpath = 'partials\compiled_templates.js'

  templateFiles = regex_walk(templates, 'partials')

  print(templateFiles)
  print()

  with open(outputpath, "w") as templateFile:
    for template in templateFiles:
      with open(template, "r") as templateInputFile:
        templateContent = templateInputFile.read()
        templateName = re.sub(stripPrefix, "", template)

        # putting the templates into the templatecache of jMaticApp
        compiledTemplate = compile_template(templateName, templateContent, 'jMaticApp')
        print(compiledTemplate)
        templateFile.write(compiledTemplate);
