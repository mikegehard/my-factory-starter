package factory

fun main(args: Array<String>) {
    val target = java.io.File(args[args.indexOf("--target") + 1])
    val harnessIndex = args.indexOf("--harness")
    val harness = if (harnessIndex >= 0) args[harnessIndex + 1] else "pi"
    ProcessBuilder(harness)
        .directory(target)
        .inheritIO()
        .start()
        .waitFor()
}
