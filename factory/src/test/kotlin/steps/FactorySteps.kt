package steps

import io.cucumber.java.After
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When
import java.io.File
import java.nio.file.Files
import kotlin.test.assertTrue

class FactorySteps {
    private lateinit var workspace: File
    private lateinit var target: File
    private lateinit var seed: File
    private var harness: String? = "test-agent"
    private var output = ""

    @Given("a copy of the factory")
    fun copyFactory() {
        workspace = Files.createTempDirectory("factory-example-").toFile()
        File("build/install/factory").copyRecursively(File(workspace, "factory"))
        File(workspace, "factory/bin/factory").setExecutable(true)
        val git = ProcessBuilder("git", "init", "--quiet")
            .directory(workspace).redirectErrorStream(true).start()
        val message = git.inputStream.bufferedReader().readText()
        check(git.waitFor() == 0) { message }
    }

    @Given("a new target")
    fun newTarget() {
        target = File(workspace, "target").apply { mkdirs() }
    }

    @Given("a seed describing a game of Tetris")
    fun tetrisSeed() {
        seed = File(workspace, "seed.md")
        seed.writeText("Build a game of Tetris in the terminal, started with npm start, within 24 rows.\n")
    }

    @Given("the agent plans the tasks alpha and beta, and does one task a pass")
    fun planningAgent() {
        val script = checkNotNull(javaClass.getResource("/agents/planning-agent.sh")).readText()
        val agents = File(workspace, "agents").apply { mkdirs() }
        for (name in listOf("pi", "test-agent")) {
            File(agents, name).apply {
                writeText(script)
                setExecutable(true)
            }
        }
    }

    @Given("no harness is chosen")
    fun noHarness() {
        harness = null
    }

    @When("the factory runs one pass")
    fun runOnePass() {
        val command = mutableListOf(
            File(workspace, "factory/bin/factory").absolutePath,
            "--seed", seed.absolutePath,
            "--target", target.absolutePath
        )
        harness?.let { command.addAll(listOf("--harness", it)) }
        val builder = ProcessBuilder(command).directory(workspace).redirectErrorStream(true)
        builder.environment()["PATH"] = File(workspace, "agents").absolutePath + ":" + System.getenv("PATH")
        builder.environment()["AGENT_CALLS"] = File(workspace, "agent-calls").absolutePath
        val process = builder.start()
        output = process.inputStream.bufferedReader().readText()
        check(process.waitFor() == 0) { "Factory failed:\n$output" }
    }

    @Then("pi has been called")
    fun piCalled() {
        val calls = File(workspace, "agent-calls")
        assertTrue(calls.exists() && "pi" in calls.readLines(), "Expected pi to be called. Factory output:\n$output")
    }

    @Then("the chosen agent has been called")
    fun chosenAgentCalled() {
        val calls = File(workspace, "agent-calls")
        assertTrue(
            calls.exists() && checkNotNull(harness) in calls.readLines(),
            "Expected the chosen agent to be called. Factory output:\n$output"
        )
    }

    @Then("pi has not been called")
    fun piNotCalled() {
        val calls = File(workspace, "agent-calls")
        assertTrue(
            !calls.exists() || "pi" !in calls.readLines(),
            "Expected pi not to be called. Factory output:\n$output"
        )
    }

    @After
    fun cleanUp() {
        if (::workspace.isInitialized) workspace.deleteRecursively()
    }
}
