# GraphaRNA-web ~ backend

## Environment setup

#### First run

To start using this project correctly you need to open this directory in CommandLine, then create a virtual environment by running: 
```python -m venv venv```

To run the virtual environment:  
MAC/Linux: run: ```source venv/bin/activate```  
Windows: run: ```venv\Scripts\activate```

After activating (venv) install the dependencies by running:
```pip install -r requirements.txt```

You should make migrations before starting the application:
```python manage.py migrate```

#### DotEnv Configuration

To store some configuration variables use```.env``` file. It should be located in /.env


## Running the application

To run the Django Project run command:

```python manage.py runserver```


## Code Audit

In order to format the code properly run:
```
make format
```

To check the quality of the code run:
```
make lint
```