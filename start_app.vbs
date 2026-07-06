' Launches the Logistics App (Flask server + Ollama AI service) with no visible windows,
' then opens the app in the default browser.

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

q = Chr(34) ' a literal double-quote character

appDir     = "d:\OneDrive\logistics_app"
pythonwExe = appDir & "\venv\Scripts\pythonw.exe"
ollamaExe  = "C:\Users\donre\AppData\Local\Programs\Ollama\ollama.exe"
logFile    = appDir & "\server_log.txt"

WshShell.CurrentDirectory = appDir

' Start Ollama (AI price search backend) hidden. Harmless if it's already running.
If FSO.FileExists(ollamaExe) Then
    ollamaCmd = "cmd /c " & q & q & ollamaExe & q & " serve" & q
    WshShell.Run ollamaCmd, 0, False
End If

' Start the Flask development server hidden, logging output for troubleshooting.
flaskCmd = "cmd /c " & q & q & pythonwExe & q & " run_dev_server.py > " & q & logFile & q & " 2>&1" & q
WshShell.Run flaskCmd, 0, False

' Give the server a moment to bind to its port before opening the browser.
WScript.Sleep 3000

' Open the app in the default browser.
WshShell.Run "http://127.0.0.1:5000/", 1, False
