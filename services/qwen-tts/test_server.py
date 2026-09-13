import unittest
from unittest.mock import Mock, patch
import server

class BridgeTests(unittest.TestCase):
    def test_fixed_profile_validation(self):
        body = dict(text="你好", model=server.MODEL_ID, language="Chinese", speaker=server.SPEAKER, instruct=server.INSTRUCTION)
        self.assertEqual(server.validate_request(body), "你好")
        for update in ({"text": ""}, {"text": "a" * 201}, {"speaker": "other"}, {"language": "English"}, {"extra": True}):
            with self.assertRaises(ValueError):
                server.validate_request({**body, **update})

    def test_generation_uses_formal_female_profile(self):
        model = Mock()
        model.generate_custom_voice.return_value = ([[0.1] * 24], 24000)
        def write(stream, *_args, **_kwargs):
            stream.write(b"RIFF" + b"x" * 100)
        with patch.dict("sys.modules", {"soundfile": Mock(write=write)}):
            server.synthesize(model, "你好")
        self.assertEqual(model.generate_custom_voice.call_args.kwargs["speaker"], "Serena")
        self.assertEqual(model.generate_custom_voice.call_args.kwargs["language"], "Chinese")
        self.assertEqual(model.generate_custom_voice.call_args.kwargs["instruct"], server.INSTRUCTION)

if __name__ == "__main__":
    unittest.main()
