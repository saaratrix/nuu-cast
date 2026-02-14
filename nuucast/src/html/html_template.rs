use crate::io::file_utility::DirectoryChildren;

pub fn get_html(title: &str, scripts_url: Option<&str>, content: &str) -> String {
    let scripts = scripts_url.map_or(String::new(), |url| {
        format!(r#"<script src="/static/{url}" type="module"></script>"#)
    });

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="/static/style.css">
    <script src="/static/js/app.js" type="module" ></script>
</head>
<body>
    {content}
    {scripts}
</body>
</html>"#)
}

pub fn get_directory_html(title: &str, directory_items: &DirectoryChildren) -> String {
    let content = get_directory_content_html(directory_items);
    get_html(title, Some("js/directories.js"), &content)
}

fn get_directory_content_html(directory_items: &DirectoryChildren) -> String {
    let mut output = "".to_string();

    output.push_str("<h2>Directories:</h2><ul>\n");
    for dir in &directory_items.directories {
        output.push_str(&format!(
            "  <li><a data-file-path=\"{}\" href=\"{}\">{}</a></li>\n",
            dir.filepath.display(),
            dir.url.display(),
            dir.url.display()
        ));
    }
    output.push_str("</ul>\n");

    output.push_str("<h2>Files:</h2><ul>\n");
    for file in &directory_items.files {
        output.push_str(&format!(
            "  <li><a data-file-path=\"{}\" href=\"/{}\">{}</a></li>\n",
            file.filepath.display(),
            file.url.display(),
            file.url.display()
        ));
    }
    output.push_str("</ul>\n");
    output
}