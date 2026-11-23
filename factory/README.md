# Kotlin factory

Requires JDK 21. The Gradle wrapper downloads Gradle on its first run.

From this folder, run the homework examples without calling real agents:

```sh
./gradlew test
```

To select only the optional real-agent examples:

```sh
./gradlew cucumber -Ptags=@real-agent
```

Step definitions belong in `src/test/kotlin/steps/`, in package `steps`.
The feature files in `spec/features/` are the tests; do not edit them.

From the repository root, run the factory:

```sh
bin/factory --seed tetris/spec.md --target tetris/tetris-001
```

For now, the entry point only prints `Factory is not built yet.`
