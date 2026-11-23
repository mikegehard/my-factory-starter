plugins {
    kotlin("jvm") version "2.2.21"
    application
}

repositories {
    mavenCentral()
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("factory.MainKt")
}

dependencies {
    testImplementation("io.cucumber:cucumber-java:8.1.0")
    testImplementation(kotlin("test"))
}

val cucumber by tasks.registering(JavaExec::class) {
    group = "verification"
    description = "Run the homework examples; use -Ptags=@real-agent for real agents."
    dependsOn(tasks.testClasses)
    classpath = sourceSets["test"].runtimeClasspath
    mainClass.set("io.cucumber.core.cli.Main")
    args(
        "--glue", "steps",
        "--plugin", "pretty",
        "--plugin", "summary",
        "--tags", providers.gradleProperty("tags").getOrElse("not @real-agent"),
        "spec/features"
    )
}

tasks.test {
    dependsOn(cucumber)
}
