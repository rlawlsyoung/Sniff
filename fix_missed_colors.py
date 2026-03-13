import os
import re

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content = re.sub(r"bg-white/\[\d\.\d+\]", "bg-white dark:bg-slate-900/60", content)
    content = content.replace("bg-white/[0.02]", "bg-slate-50 dark:bg-slate-900/50")
    content = content.replace("bg-white/[0.04]", "bg-white dark:bg-slate-900/60")
    content = content.replace("bg-white/[0.035]", "bg-white dark:bg-slate-900/60")

    # fix specific strings
    content = content.replace("bg-slate-200 dark:bg-white/2", "bg-slate-50 dark:bg-slate-900/50")
    content = content.replace("hover:bg-slate-200 dark:bg-white/6", "hover:bg-slate-50 dark:hover:bg-slate-800")
    content = content.replace("dark:border-white/25", "dark:border-slate-700")
    
    # theme toggle
    content = content.replace("hover:bg-slate-200 dark:hover:bg-white dark:bg-slate-800", "hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800")
    content = content.replace("dark:hover:bg-white/10", "dark:hover:bg-slate-800")
    
    content = content.replace("text-slate-900 dark:text-gray-100", "text-slate-900 dark:text-slate-100")
    
    content = content.replace("border-dashed border-slate-300", "border-dashed border-slate-300 dark:border-slate-700")
    content = content.replace("border-dashed border-slate-300 dark:border-slate-700 dark:border-slate-700", "border-dashed border-slate-300 dark:border-slate-700")
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk("app/components"):
    for file in files:
        if file.endswith('.tsx'):
            refactor_file(os.path.join(root, file))
