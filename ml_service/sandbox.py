import json
import numpy as np

def test():
    from fastapi.encoders import jsonable_encoder
    from optimizer import PortfolioOptimizer
    opt = PortfolioOptimizer(['ADANIPORTS.NS', '^NSEI'])
    optimization = opt.optimize_portfolio(risk_tolerance='medium')
    frontier = opt.efficient_frontier(500)
    data = {
        'recommended_allocation': optimization['allocation'],
        'expected_metrics': {
            'annual_return': f"{optimization['expected_annual_return']*100:.2f}%",
            'volatility': f"{optimization['expected_volatility']*100:.2f}%",
            'sharpe_ratio': f"{optimization['sharpe_ratio']:.2f}"
        },
        'efficient_frontier': frontier,
        'message': 'test'
    }
    
    try:
        jsonable_encoder(data)
        print("jsonable_encoder SUCCESS")
    except Exception as e:
        print("jsonable_encoder FAILED:", e)
        
    try:
        json.dumps(data)
        print("json.dumps SUCCESS")
    except Exception as e:
        print("json.dumps FAILED:", e)

test()
