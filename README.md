# SETUP

## FastAPI (backend)

Python Virtual Environment

    $ python -m venv env
    $ source env/bin/activate

Configure PIP

    $ python -m ensurepip --upgrade
    $ python -m pip install --upgrade pip

Install FastAPI

    $ pip install "fastapi[standard]"

Run FastAPI server

    $ fastapi dev main.py

## REACT (frontend)

Install NVM

    $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
    $ source ~/.bashrc
    $ nvm install --lts
    $ nvm ls

Install Vite

    $ npm install -D vite

Create React App Template

    $ npm create vite@latest my-app -- --template react-ts

Run Vite Server

    $ npx vite

Run Dev Server

    $ npm run dev