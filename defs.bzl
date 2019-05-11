load("@tools_evertz_rules_aws//internal/s3_push:s3_push.bzl",
    ev_s3_push = "ev_s3_push",
)

load("@build_bazel_rules_nodejs//:defs.bzl", _yarn_install = "yarn_install")
def setup_rules_aws():
    _yarn_install(
        name = "tools_evertz_rules_aws_s3_npm",
        package_json = "@tools_evertz_rules_aws//internal/s3_push:package.json",
        yarn_lock = "@tools_evertz_rules_aws//internal/s3_push:yarn.lock",
    )