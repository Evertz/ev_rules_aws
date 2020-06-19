# ev_rules_aws
 
A set of [bazel](https://bazel.build) rules that provide macros and rules for interacting
with Amazon web services.

## Setup
These rules require [bazel_rules_nodejs](https://github.com/bazelbuild/rules_nodejs)

Add a WORKSPACE dependency on this repository
```
git_repository(
    name = "tools_evertz_rules_aws",
    remote = "https://github.com/evertz/ev_rules_aws.git",
    commit = "REPLACE_WITH_COMMIT",
)

load("@tools_evertz_rules_aws//:defs.bzl", "setup_rules_aws")

setup_rules_aws()
```

## Rules
### ev_s3_push
Pushes a set of files to an S3 bucket, use with `bazel run`

| Attr   | Description  |
|---|---|
| bucket_name | Name of the S3 bucket to push to |
| files | A list of files or labels that should be pushed |
| strip_prefix | Files are pushed with their full path intact.<br>This can be customized by setting `strip_prefix` which will then be removed from the start of the file path, defaults to an empty string. |
| base_prefix | The prefix to be added to each of the files to give it in a place in the bucket, defaults to `/`.<br>This field can substitute values from env vars defined in `configuration_env_vars`.<br>Use the syntax `/some/{FOO}/path` for replacement |
| empty_prefix_files | If set to `True`, this will cause files under `base_prefix` that are already in the bucket to be removed before the new files are pushed. Defaults to `False` |
| configuration_env_vars | A list of env variables that will be made available to this rule. Can also take input from `--define`  |

```
load("@tools_evertz_rules_aws//:defs.bzl", "ev_s3_push")

ev_s3_push(
    name = "docs",
    files = [":some_label", "README.md"],
    bucket_name = "docs_site",
    strip_prefix = "workspace_name/rules_aws",
    base_prefix = "bazel",
)
```
