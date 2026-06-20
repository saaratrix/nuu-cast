use std::path::PathBuf;

pub fn get_html(title: &str, body_class: &str, scripts_url: Option<&str>, url: &PathBuf, content: &str) -> String {
    let scripts = scripts_url.map_or(String::new(), |url| {
        format!(r#"<script src="/static/{url}" type="module"></script>"#)
    });

    let navbar = get_navbar(url);

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="/static/css/styles.css">
    <script src="/static/js/app.js" type="module" ></script>
</head>
<body class="{body_class}">
    {navbar}
    {content}
    {scripts}
</body>
</html>"#)
}

pub fn get_navbar(url: &PathBuf) -> String {
    let mut breadcrumbs = String::new();
    let mut accumulated_path = PathBuf::new();

    breadcrumbs.push_str(r#"<a class="breadcrumb-link" href="/">Home</a>"#);
    for component in url.components() {
        if let std::path::Component::Normal(segment) = component {
            accumulated_path.push(segment);
            let segment_str = segment.to_string_lossy();
            let path_str = accumulated_path.display();

            breadcrumbs.push_str(&format!(r#" / <a class="breadcrumb-link" href="/{path_str}">{segment_str}</a>"#));
        }
    }

    format!(r#"<nav class="navbar">{breadcrumbs}</nav>"#)
}

pub fn get_browser_html() -> String {
    let title = "Browser";
    let html = get_html(&title, "browser", None, &PathBuf::from(""), "<div class='items-container'></div>");
    html
}