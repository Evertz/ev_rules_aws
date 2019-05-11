load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

def ev_s3_push(name, bucket_name, files = [], strip_prefix = '', base_prefix = '/', empty_prefix_files = False, **kwargs):
    file_paths = [("$(locations %s) " % file) for file in files]

    nodejs_binary(
        name = name,
        node_modules = "@tools_evertz_rules_aws_s3_npm//:node_modules",
        data = [
            "@tools_evertz_rules_aws//internal/s3_push:main.js",
            "@tools_evertz_rules_aws_s3_npm//s3-client",
        ] + files,
        entry_point = "tools_evertz_rules_aws/internal/s3_push/main.js",
        install_source_map_support = False,
        templated_args = [
            bucket_name,
            strip_prefix,
            base_prefix,
            str(empty_prefix_files),
        ] + file_paths,
        **kwargs
    )
