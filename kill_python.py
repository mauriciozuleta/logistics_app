#!/usr/bin/env python3
"""
Kill All Python Processes Script
Author: GitHub Copilot
Purpose: Terminates all running Python processes including Flask servers, virtual environments, etc.
Usage: python kill_python.py
"""

import subprocess
import sys
import os

def kill_python_processes():
    """Kill all Python processes on Windows"""
    
    print("🔍 Searching for Python processes...")
    
    processes_to_kill = [
        'python.exe',
        'pythonw.exe',
        'py.exe',
        'python3.exe',
        'python3.11.exe',
        'python3.10.exe',
        'python3.9.exe'
    ]
    
    killed_count = 0
    
    for process_name in processes_to_kill:
        try:
            print(f"🎯 Attempting to kill {process_name}...")
            
            # Use taskkill with force flag
            result = subprocess.run(
                ['taskkill', '/f', '/im', process_name],
                capture_output=True,
                text=True,
                shell=True
            )
            
            if result.returncode == 0:
                print(f"✅ Successfully killed {process_name}")
                killed_count += 1
            else:
                if "not found" not in result.stderr.lower():
                    print(f"⚠️  {process_name}: {result.stderr.strip()}")
                else:
                    print(f"ℹ️  No {process_name} processes found")
                    
        except Exception as e:
            print(f"❌ Error killing {process_name}: {e}")
    
    # Alternative method: Use wmic to find and kill Python processes
    try:
        print("\n🔍 Using alternative method to find Python processes...")
        
        # Get list of processes with 'python' in the name
        wmic_result = subprocess.run(
            ['wmic', 'process', 'where', 'name like "%python%"', 'get', 'ProcessId,Name'],
            capture_output=True,
            text=True,
            shell=True
        )
        
        if wmic_result.returncode == 0 and wmic_result.stdout:
            lines = wmic_result.stdout.strip().split('\n')
            for line in lines[1:]:  # Skip header
                if line.strip() and 'python' in line.lower():
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        try:
                            process_name = parts[0]
                            process_id = parts[1]
                            
                            print(f"🎯 Found Python process: {process_name} (PID: {process_id})")
                            
                            # Kill by PID
                            kill_result = subprocess.run(
                                ['taskkill', '/f', '/pid', process_id],
                                capture_output=True,
                                text=True,
                                shell=True
                            )
                            
                            if kill_result.returncode == 0:
                                print(f"✅ Successfully killed PID {process_id}")
                                killed_count += 1
                            else:
                                print(f"⚠️  Failed to kill PID {process_id}: {kill_result.stderr.strip()}")
                                
                        except Exception as e:
                            print(f"❌ Error processing line '{line}': {e}")
                            
    except Exception as e:
        print(f"❌ Error with alternative method: {e}")
    
    return killed_count

def main():
    """Main function"""
    print("=" * 50)
    print("🐍 PYTHON PROCESS KILLER")
    print("=" * 50)
    print("This script will terminate ALL Python processes")
    print("including Flask servers, virtual environments, etc.")
    print("-" * 50)
    
    # Confirmation prompt
    try:
        response = input("⚠️  Continue? (y/N): ").lower().strip()
        if response not in ['y', 'yes']:
            print("🚫 Operation cancelled by user")
            return
    except KeyboardInterrupt:
        print("\n🚫 Operation cancelled by user")
        return
    
    print("\n🚀 Starting Python process termination...")
    
    killed_count = kill_python_processes()
    
    print("\n" + "=" * 50)
    if killed_count > 0:
        print(f"✅ Successfully terminated {killed_count} Python process(es)")
    else:
        print("ℹ️  No Python processes were found or terminated")
    
    print("🎉 Operation completed!")
    print("=" * 50)
    
    # Keep window open for a moment
    try:
        input("\nPress Enter to exit...")
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
