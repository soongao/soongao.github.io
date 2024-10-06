import os

def convert_py_to_md(directory):
    # 遍历指定目录下的所有文件
    for filename in os.listdir(directory):
        if filename.endswith('.py'):
            file_path = os.path.join(directory, filename)
            output_path = os.path.join(directory, filename[:-3] + '.md')

            # 读取Python文件的内容
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # 写入Markdown文件
            with open(output_path, 'w', encoding='utf-8') as md_file:
                # 添加Markdown文件的头部
                md_file.write(f'# {filename[:-3]}\n\n')
                md_file.write('```python\n')
                md_file.write(content)
                md_file.write('\n```\n')

if __name__ == '__main__':
    directory = './'
    convert_py_to_md(directory)
    print("转换完成。")